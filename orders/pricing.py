from decimal import Decimal, ROUND_HALF_UP

GST_RATE = Decimal('0.18')
GST_DIVISOR = Decimal('1.18')

DEFAULT_PRICES = {
    'check': Decimal('99.00'),
    'improve': Decimal('299.00'),
    'complete': Decimal('549.00'),
}

PACKAGE_LABELS = {
    'check': 'Check — Similarity Check',
    'improve': 'Improve — Similarity Improvement',
    'complete': 'Complete — Research Paper Package',
}


def money(value):
    return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def gst_breakdown(gross):
    """Split a GST-inclusive customer price into taxable value and 18% GST."""
    gross = money(gross)
    taxable = money(gross / GST_DIVISOR)
    gst = money(gross - taxable)
    return taxable, gst, gross


def customer_price(stored, package):
    """Return GST-inclusive public price, ignoring leftover per-word rates like 0.50."""
    expected = DEFAULT_PRICES[package]
    try:
        value = money(stored)
    except Exception:
        return expected
    if value < 10:
        return expected
    return value


def default_pricing_kwargs():
    return {
        'per_word_rate': DEFAULT_PRICES['check'],
        'express_fee': DEFAULT_PRICES['improve'],
        'editing_suggestions_fee': DEFAULT_PRICES['complete'],
    }


def package_from_flags(is_express=False, has_suggestions=False):
    if has_suggestions:
        return 'complete'
    if is_express:
        return 'improve'
    return 'check'


def resolve_package(data, config=None):
    package = str(data.get('package') or data.get('package_tier') or '').strip().lower()
    if package not in DEFAULT_PRICES:
        has_suggestions = data.get('has_suggestions') in (True, 'true', 'True', '1')
        is_express = data.get('is_express') in (True, 'true', 'True', '1')
        package = package_from_flags(is_express, has_suggestions)

    if package == 'complete':
        price = customer_price(config.editing_suggestions_fee if config else None, 'complete')
        flags = {'is_express': True, 'has_editing_suggestions': True}
    elif package == 'improve':
        price = customer_price(config.express_fee if config else None, 'improve')
        flags = {'is_express': True, 'has_editing_suggestions': False}
    else:
        price = customer_price(config.per_word_rate if config else None, 'check')
        flags = {'is_express': False, 'has_editing_suggestions': False}

    return package, money(price), flags


def package_catalog(config):
    mapping = {
        'check': customer_price(getattr(config, 'per_word_rate', None), 'check'),
        'improve': customer_price(getattr(config, 'express_fee', None), 'improve'),
        'complete': customer_price(getattr(config, 'editing_suggestions_fee', None), 'complete'),
    }
    catalog = {}
    for key, gross in mapping.items():
        taxable, gst, total = gst_breakdown(gross)
        catalog[key] = {
            'id': key,
            'label': PACKAGE_LABELS[key],
            'price': float(total),
            'taxable': float(taxable),
            'gst': float(gst),
            'gst_rate': 18,
            'gst_included': True,
        }
    return catalog
