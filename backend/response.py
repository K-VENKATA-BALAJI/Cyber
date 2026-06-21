RESPONSE_RULES = {
    "Normal": {
        "severity": "None",
        "action": "No Action",
        "description": "Traffic is normal. No action required.",
        "color": "green",
    },
    "DoS": {
        "severity": "Critical",
        "action": "Block & Alert",
        "description": "Denial of Service attack detected. Block source IP immediately and alert SOC team.",
        "color": "red",
    },
    "Probe": {
        "severity": "High",
        "action": "Monitor & Alert",
        "description": "Network scanning or probing detected. Monitor connection and alert security team.",
        "color": "orange",
    },
    "R2L": {
        "severity": "High",
        "action": "Block & Investigate",
        "description": "Remote to Local attack detected. Block unauthorized remote access and investigate.",
        "color": "orange",
    },
    "U2R": {
        "severity": "Critical",
        "action": "Isolate & Investigate",
        "description": "Privilege escalation attempt detected. Isolate the system immediately for forensic analysis.",
        "color": "red",
    },
}


def get_response(prediction: str):
    return RESPONSE_RULES.get(prediction, RESPONSE_RULES["Normal"])
