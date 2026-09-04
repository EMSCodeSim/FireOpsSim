"""Shared helpers for FireOpsSim skill-support catalog generation."""

SHARED_SOURCES = {
    "nfa": {"label": "National Fire Academy", "url": "https://www.usfa.fema.gov/nfa/", "scope": "Free federal fire-service training and professional development"},
    "fsri": {"label": "FSRI Fire Safety Academy", "url": "https://training.fsri.org/", "scope": "Evidence-based structural firefighting education"},
    "niosh": {"label": "NIOSH Firefighter Center", "url": "https://www.cdc.gov/niosh/firefighters/", "scope": "Firefighter safety, exposure, and occupational health"},
    "proboard": {"label": "Pro Board", "url": "https://theproboard.org/accredited-agencies/", "scope": "Accredited fire certification agencies"},
    "ifsac": {"label": "IFSAC", "url": "https://ifsac.org/", "scope": "Accredited certifying entities and programs"},
    "fema": {"label": "FEMA Independent Study", "url": "https://training.fema.gov/is/crslist.aspx", "scope": "ICS/NIMS and emergency management courses"},
    "phmsa": {"label": "PHMSA ERG", "url": "https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg", "scope": "Current Emergency Response Guidebook"},
    "usfa": {"label": "U.S. Fire Administration", "url": "https://www.usfa.fema.gov/", "scope": "National fire-service guidance and training"},
}


def src(*ids):
    return [SHARED_SOURCES[i] for i in ids]


def q(prompt, choices, answer, why):
    return {"q": prompt, "choices": choices, "answer": answer, "why": why}


def res(label, url, note="", type_="practice"):
    return {"label": label, "url": url, "note": note, "type": type_}


def mode(title, instructions, points, mistakes, debrief):
    return {
        "title": title,
        "instructions": instructions,
        "performancePoints": points,
        "commonMistakes": mistakes,
        "debrief": debrief,
    }


def drill(objective, equipment, setup, m5, m15, m30):
    return {
        "objective": objective,
        "equipment": equipment,
        "setup": setup,
        "disclaimer": "Completing this drill does not satisfy an official certification task, skill sheet, or Roadmap Taskbook item.",
        "modes": {"5": m5, "15": m15, "30": m30},
    }


def skill(**kwargs):
    kwargs.setdefault("seeResources", [])
    kwargs.setdefault("aliases", [])
    kwargs.setdefault("searchKeywords", [])
    kwargs.setdefault("relatedSkills", [])
    return kwargs
