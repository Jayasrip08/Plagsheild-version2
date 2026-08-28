TOPIC_MAP = {
    'general': [
        'How do I submit a paper?',
        'When will my report arrive?',
        'How do I register for a conference?',
        'Other general question',
    ],
    'payment': [
        'Payment failed',
        'Amount deducted but status pending',
        'Wrong payment',
        'Refund request',
    ],
    'submission': [
        'Upload problem',
        'Wrong file submitted',
        'Paper status issue',
        'Revision problem',
    ],
    'report': [
        'Report not generated',
        'Report cannot be downloaded',
        'Report-related question',
    ],
}


def valid_topic(category, topic):
    return topic in TOPIC_MAP.get(category, [])
