import json
import pypdf
import docx
import os
from django.utils import timezone
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.core.mail import send_mail
from django.http import FileResponse, HttpResponse
from django.db.models import Q
from django.conf import settings
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Order, PricingConfig
from .serializers import OrderSerializer, PricingConfigSerializer
from .pricing import default_pricing_kwargs, gst_breakdown, package_catalog, PACKAGE_LABELS, resolve_package
from accounts.models import User
from accounts.permissions import IsSuperAdmin, IsCollegeAdmin
from colleges.models import College

# Create signer for secure download link
signer = TimestampSigner()
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = ('.pdf', '.doc', '.docx')


def extract_submission_meta(request):
    raw_co_authors = request.data.get('co_authors') or '[]'
    if isinstance(raw_co_authors, str):
        try:
            co_authors = json.loads(raw_co_authors)
        except json.JSONDecodeError:
            co_authors = []
    elif isinstance(raw_co_authors, list):
        co_authors = raw_co_authors
    else:
        co_authors = []

    cleaned = []
    for item in co_authors:
        if not isinstance(item, dict):
            continue
        name = str(item.get('name') or '').strip()
        if not name:
            continue
        cleaned.append({
            'name': name,
            'email': str(item.get('email') or '').strip(),
            'institution': str(item.get('institution') or '').strip(),
        })

    return {
        'paper_title': str(request.data.get('paper_title') or '').strip(),
        'paper_type': str(request.data.get('paper_type') or '').strip(),
        'subject_area': str(request.data.get('subject_area') or '').strip(),
        'purpose': str(request.data.get('purpose') or '').strip(),
        'keywords': str(request.data.get('keywords') or '').strip(),
        'author_name': str(request.data.get('author_name') or '').strip(),
        'author_email': str(request.data.get('author_email') or '').strip(),
        'author_institution': str(request.data.get('author_institution') or '').strip(),
        'author_country': str(request.data.get('author_country') or '').strip(),
        'co_authors': cleaned,
    }

def get_word_count(file):
    name = file.name.lower()
    text = ""
    try:
        # Seek file to start
        file.seek(0)
        if name.endswith('.pdf'):
            reader = pypdf.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        elif name.endswith('.docx'):
            doc = docx.Document(file)
            for para in doc.paragraphs:
                text += para.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
        else:
            text = file.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error parsing file for word count: {e}")
        text = "fallback text"
    
    words = text.split()
    count = len(words)
    return max(count, 1)


class WordCountEstimateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        word_count = get_word_count(uploaded_file)

        config = PricingConfig.objects.last()
        if not config:
            config = PricingConfig.objects.create(**default_pricing_kwargs())

        package, total_price, _flags = resolve_package(request.data, config)
        taxable, gst, gross = gst_breakdown(total_price)

        return Response({
            "filename": uploaded_file.name,
            "word_count": word_count,
            "package": package,
            "package_label": PACKAGE_LABELS[package],
            "taxable_value": float(taxable),
            "gst": float(gst),
            "total_price": float(gross),
        })


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            queryset = Order.objects.all()
            search_query = self.request.query_params.get('search', '').strip()
            status_query = self.request.query_params.get('status', '').strip()
            if search_query:
                search_filters = (
                    Q(document__icontains=search_query)
                    | Q(paper_title__icontains=search_query)
                    | Q(author_name__icontains=search_query)
                    | Q(user__username__icontains=search_query)
                    | Q(user__email__icontains=search_query)
                    | Q(payment__razorpay_payment_id__icontains=search_query)
                    | Q(payment__razorpay_order_id__icontains=search_query)
                    | Q(payment__transaction_id__icontains=search_query)
                )
                if search_query.isdigit():
                    search_filters |= Q(user__id=int(search_query)) | Q(id=int(search_query))
                queryset = queryset.filter(search_filters)
            if status_query:
                queryset = queryset.filter(status__iexact=status_query)
            return queryset.select_related('user', 'college', 'payment').order_by('-created_at')
        elif user.role == 'college_admin':
            # Submissions for all students in this college
            if not user.college:
                return Order.objects.none()
            
            # Apply filters
            queryset = Order.objects.filter(college=user.college)
            department = self.request.query_params.get('department')
            start_date = self.request.query_params.get('start_date')
            end_date = self.request.query_params.get('end_date')
            min_similarity = self.request.query_params.get('min_similarity')
            max_similarity = self.request.query_params.get('max_similarity')
            
            if department:
                queryset = queryset.filter(department__iexact=department)
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)
            if min_similarity:
                queryset = queryset.filter(similarity_score__gte=float(min_similarity))
            if max_similarity:
                queryset = queryset.filter(similarity_score__lte=float(max_similarity))
                
            return queryset.select_related('user', 'college', 'payment').order_by('-created_at')
        else:
            # Normal B2C user sees only their own orders
            return Order.objects.filter(user=user).select_related('payment', 'college').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        if 'document' not in request.FILES:
            return Response({"error": "Document file is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        file = request.FILES['document']
        filename = (file.name or '').lower()
        if not filename.endswith(ALLOWED_EXTENSIONS):
            return Response(
                {"error": "Accepted formats are PDF, DOC, and DOCX."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if file.size > MAX_UPLOAD_BYTES:
            return Response(
                {"error": "Maximum file size is 25 MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        meta = extract_submission_meta(request)
        if not meta['paper_title']:
            return Response({"error": "Paper title is required."}, status=status.HTTP_400_BAD_REQUEST)

        is_b2b_submission = request.data.get('is_b2b') == 'true' or request.data.get('is_b2b') is True

        word_count = get_word_count(file)
        config = PricingConfig.objects.last()
        if not config:
            config = PricingConfig.objects.create(**default_pricing_kwargs())

        package, total_price, package_flags = resolve_package(request.data, config)

        if is_b2b_submission:
            # Check B2B eligibility
            if not user.college:
                return Response({"error": "Your account is not associated with any college B2B credits."}, status=status.HTTP_400_BAD_REQUEST)
            if user.college.credits < 1:
                return Response({"error": "Insufficient credits remaining for your college account. Please contact college admin."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Deduct 1 credit
            college = user.college
            college.credits -= 1
            college.save()

            # Check low credit warning (credits < 20% of allocated)
            if college.allocated_credits > 0 and (college.credits / college.allocated_credits) < 0.20:
                # Log warning
                print(f"[ALERT] College '{college.college_name}' credits are low! ({college.credits} remaining out of {college.allocated_credits})")
                # Send email to college admin if email exists
                if college.contact_email:
                    try:
                        send_mail(
                            'Low Credit Alert - Innoresearx Platform',
                            f"Dear Admin,\n\nYour college account credits are running low. Remaining balance: {college.credits} out of {college.allocated_credits}.\n\nPlease renew/top up credits from the dashboard.\n\nBest regards,\nInnoresearx Team",
                            'admin@innoresearx.com',
                            [college.contact_email],
                            fail_silently=True
                        )
                    except Exception as e:
                        print(f"Failed to send low credit email: {e}")

            # Create Order
            order = Order.objects.create(
                user=user,
                document=file,
                word_count=word_count,
                price=0.00,
                status='Submitted',
                package_tier=package,
                is_express=package_flags['is_express'],
                has_editing_suggestions=package_flags['has_editing_suggestions'],
                is_b2b=True,
                college=college,
                department=user.department or 'General',
                **meta,
            )
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        else:
            # Create Order (status: Pending Payment, waiting for payment completion)
            order = Order.objects.create(
                user=user,
                document=file,
                word_count=word_count,
                price=total_price,
                status='Pending Payment',
                package_tier=package,
                is_express=package_flags['is_express'],
                has_editing_suggestions=package_flags['has_editing_suggestions'],
                is_b2b=False,
                **meta,
            )
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.select_related('user', 'college', 'payment')
    serializer_class = OrderSerializer


class AddEditingSuggestionsView(APIView):
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.has_editing_suggestions:
            return Response({"message": "Editing suggestions already added"}, status=status.HTTP_200_OK)

        config = PricingConfig.objects.last()
        upsell_fee = config.editing_suggestions_fee if config else default_pricing_kwargs()['editing_suggestions_fee']
        
        order.has_editing_suggestions = True
        order.package_tier = 'complete'
        order.price += upsell_fee
        order.save()

        # If there is a payment record, update its amount as well
        if hasattr(order, 'payment'):
            payment = order.payment
            payment.amount += upsell_fee
            payment.save()

        return Response({
            "message": "Editing suggestions added successfully",
            "price": order.price
        })


class DownloadReportView(APIView):
    permission_classes = [permissions.AllowAny] # Anyone with the secure signed URL can download

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        token = request.query_params.get('token')
        if not token:
            return Response({"error": "Secure download token is missing"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify Signature & Age
        try:
            # Max age of 48 hours (48 * 3600 = 172800 seconds)
            unsigned_id = signer.unsign(token, max_age=172800)
            if int(unsigned_id) != order.id:
                return Response({"error": "Invalid token signature"}, status=status.HTTP_400_BAD_REQUEST)
        except SignatureExpired:
            return Response({"error": "This report link has expired (valid for 48 hours only)"}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
            return Response({"error": "Invalid secure download link signature"}, status=status.HTTP_400_BAD_REQUEST)

        # Check report_uploaded_at as a secondary safety check
        if order.report_uploaded_at:
            delta = timezone.now() - order.report_uploaded_at
            if delta.total_seconds() > 172800:
                return Response({"error": "Report download window of 48 hours has expired"}, status=status.HTTP_400_BAD_REQUEST)

        if not order.report_file:
            return Response({"error": "Report file has not been uploaded yet"}, status=status.HTTP_400_BAD_REQUEST)

        # Serve file response
        file_path = order.report_file.path
        if not os.path.exists(file_path):
            return Response({"error": "Report file not found on server storage"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'), content_type='application/pdf')


class OrderInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user.role != 'super_admin' and order.user != request.user:
            return Response({"error": "You do not have access to this invoice"}, status=status.HTTP_403_FORBIDDEN)

        # Import reportlab details
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from io import BytesIO

        try:
            # Use BytesIO instead of HttpResponse for safer PDF generation
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
            story = []

            styles = getSampleStyleSheet()
            
            # Custom Styles
            brand_style = ParagraphStyle(
                'BrandStyle',
                parent=styles['Heading1'],
                fontSize=22,
                textColor=colors.HexColor("#4F46E5"),
                spaceAfter=4,
                fontName="Helvetica-Bold"
            )
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor("#1F2937"),
                spaceAfter=15,
                alignment=2 # Right aligned
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                fontSize=9.5,
                textColor=colors.HexColor("#374151"),
                leading=14
            )
            table_header_style = ParagraphStyle(
                'TableHeader',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor("#FFFFFF"),
                fontName="Helvetica-Bold"
            )

            # Invoice Header Block
            doc_name = os.path.basename(order.document.name) if order.document else "Document"
            user_full_name = order.user.get_full_name() or order.user.username
            user_phone = getattr(order.user, 'phone', 'N/A') or 'N/A'

            header_data = [
                [
                    Paragraph("<b>INNORESEARX</b><br/><font size=8.5 color='#6B7280'>Enterprise Document Verification Platform</font>", brand_style),
                    Paragraph("TAX INVOICE<br/><font size=9 color='#6B7280'>Invoice #: INV-%06d</font>" % order.id, title_style)
                ]
            ]
            header_table = Table(header_data, colWidths=[300, 240])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(header_table)
            story.append(Spacer(1, 15))

            # Metadata & Billing Information Grid
            info_data = [
                [
                    Paragraph("<b>Billed To:</b><br/>"
                              f"Client Name: <b>{user_full_name}</b><br/>"
                              f"Email: {order.user.email}<br/>"
                              f"Phone: {user_phone}<br/>"
                              f"Department: {order.department or 'General'}", body_style),
                    Paragraph("<b>Invoice Summary:</b><br/>"
                              f"Invoice Date: <b>{order.created_at.strftime('%d %b %Y')}</b><br/>"
                              f"Billing Type: <b>{'B2B Institutional Credit' if order.is_b2b else 'B2C Online Payment'}</b><br/>"
                              f"Order Status: <b>{order.status}</b><br/>"
                              f"Payment ID: {getattr(order, 'payment', None) and order.payment.razorpay_payment_id or 'B2B Credit Allocation'}", body_style)
                ]
            ]
            info_table = Table(info_data, colWidths=[270, 270])
            info_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F9FAFB")),
                ('BACKGROUND', (1,0), (1,0), colors.HexColor("#F3F4F6")),
                ('PADDING', (0,0), (-1,-1), 10),
                ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#E5E7EB")),
                ('BOX', (1,0), (1,0), 0.5, colors.HexColor("#E5E7EB")),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))

            # Line Items Table — GST-inclusive customer price with 18% split
            package = order.package_tier or ('complete' if order.has_editing_suggestions else 'improve' if order.is_express else 'check')
            package_name = PACKAGE_LABELS.get(package, 'Check — Similarity Check')
            if order.is_b2b:
                table_data = [
                    [Paragraph("Item / Service Description", table_header_style), Paragraph("Taxable Value", table_header_style), Paragraph("GST 18%", table_header_style), Paragraph("Amount (INR)", table_header_style)],
                    [
                        Paragraph(f"<b>{package_name}</b><br/><font size=8.5 color='#6B7280'>Document: {doc_name}</font>", body_style),
                        Paragraph("—", body_style),
                        Paragraph("—", body_style),
                        Paragraph("1 B2B Credit", body_style),
                    ],
                    [
                        Paragraph("<b>Total Amount Billed</b>", body_style),
                        Paragraph("", body_style),
                        Paragraph("", body_style),
                        Paragraph("<b>1 Credit</b>", body_style),
                    ],
                ]
            else:
                taxable, gst, gross = gst_breakdown(order.price)
                table_data = [
                    [Paragraph("Item / Service Description", table_header_style), Paragraph("Taxable Value", table_header_style), Paragraph("GST 18%", table_header_style), Paragraph("Customer Pays", table_header_style)],
                    [
                        Paragraph(f"<b>{package_name}</b><br/><font size=8.5 color='#6B7280'>GST included · Document: {doc_name}</font>", body_style),
                        Paragraph("₹ %.2f" % taxable, body_style),
                        Paragraph("₹ %.2f" % gst, body_style),
                        Paragraph("₹ %.2f" % gross, body_style),
                    ],
                    [
                        Paragraph("<b>Total (GST included)</b>", body_style),
                        Paragraph("₹ %.2f" % taxable, body_style),
                        Paragraph("₹ %.2f" % gst, body_style),
                        Paragraph("<b>₹ %.2f</b>" % gross, body_style),
                    ],
                ]

            summary_table = Table(table_data, colWidths=[220, 110, 100, 110])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4F46E5")),
                ('ALIGN', (1,1), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor("#E5E7EB")),
                ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor("#4F46E5")),
                ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EEF2FF")),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 25))

            # Footer / Terms
            footer_text = Paragraph(
                "<font color='#6B7280' size=8.5><b>Terms & Support:</b> This is an official computer-generated receipt/invoice issued by Innoresearx. For support or queries regarding this document verification, please contact <u>support@innoresearx.com</u>.</font>",
                body_style
            )
            story.append(footer_text)

            doc.build(story)
            
            # Get PDF bytes
            pdf_buffer.seek(0)
            pdf_bytes = pdf_buffer.getvalue()
            pdf_buffer.close()

            # Return PDF response
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Invoice_{order.id}.pdf"'
            return response
            
        except Exception as e:
            print(f"Error generating invoice for order {pk}: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Failed to generate invoice: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SuperAdminOrderQueueView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        # Return all pending orders (B2B, Paid B2C, or newly Submitted orders), sorted express priority first
        return Order.objects.exclude(status='Report Ready').select_related('user', 'college', 'payment').order_by('-is_express', '-created_at')


class SuperAdminUpdateOrderView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'start_processing' or 'complete'
        
        if action == 'start_processing':
            order.status = 'Processing'
            order.save()
            return Response({
                "message": "Order marked as Processing",
                "status": order.status
            })
            
        elif action == 'complete':
            similarity_score = request.data.get('similarity_score')
            report_file = request.FILES.get('report_file')
            
            if similarity_score is None:
                return Response({"error": "Similarity score is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not report_file:
                return Response({"error": "Report PDF file is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                similarity_score = float(similarity_score)
            except ValueError:
                return Response({"error": "Similarity score must be a number"}, status=status.HTTP_400_BAD_REQUEST)

            order.similarity_score = similarity_score
            order.report_file = report_file
            order.status = 'Report Ready'
            order.report_uploaded_at = timezone.now()
            order.save()

            # Generate expiring signed download URL
            token = signer.sign(str(order.id))
            # Create absolute URL or relative download link
            secure_link = f"/api/orders/{order.id}/download-report/?token={token}"

            # Simulate Notifications (Email & WhatsApp)
            print(f"[NOTIFICATION] Email and WhatsApp sent to user '{order.user.username}' (phone: {order.user.phone or 'N/A'}, email: {order.user.email})")
            print(f"[WHATSAPP SIMULATION] Message: Your document integrity report for {os.path.basename(order.document.name)} is ready! Similarity: {similarity_score}%. Download link valid for 48 hours: {secure_link}")

            try:
                # Send Email
                send_mail(
                    'Your Integrity Verification Report is Ready!',
                    f"Hi {order.user.username},\n\nYour document '{os.path.basename(order.document.name)}' has been verified.\nSimilarity Score: {similarity_score}%\n\nYou can access the secure download link below. Note: This link is valid only for 48 hours:\n{request.build_absolute_uri(secure_link)}\n\nBest regards,\nInnoresearx Support Team",
                    'support@innoresearx.com',
                    [order.user.email],
                    fail_silently=True
                )
            except Exception as ex:
                print(f"Failed to send notification email: {ex}")

            return Response({
                "message": "Order marked as Complete. Notifications triggered.",
                "status": order.status,
                "similarity_score": order.similarity_score,
                "secure_download_url": secure_link
            })
            
        else:
            return Response({"error": "Invalid action. Must be 'start_processing' or 'complete'"}, status=status.HTTP_400_BAD_REQUEST)


class PricingConfigView(APIView):
    # Retrieve configuration (available to all logged in users)
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        config = PricingConfig.objects.last()
        if not config:
            config = PricingConfig.objects.create(**default_pricing_kwargs())
        serializer = PricingConfigSerializer(config)
        payload = serializer.data
        payload['gst_rate'] = 18
        payload['packages'] = package_catalog(config)
        # Always expose GST-inclusive public prices, never leftover per-word 0.50
        payload['per_word_rate'] = payload['packages']['check']['price']
        payload['express_fee'] = payload['packages']['improve']['price']
        payload['editing_suggestions_fee'] = payload['packages']['complete']['price']
        return Response(payload)

    def post(self, request):
        # Update configuration (superadmin only)
        if request.user.role != 'super_admin':
            return Response({"error": "Only super admins can modify pricing configuration"}, status=status.HTTP_403_FORBIDDEN)
            
        config = PricingConfig.objects.last()
        if not config:
            config = PricingConfig()
            
        serializer = PricingConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
