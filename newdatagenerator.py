import json
from faker import Faker
import random
from datetime import datetime, timedelta
import requests
import pytz
import time
import os
import sys
from typing import Dict, List, Optional, Tuple, Any

# Initialize Faker
fake = Faker('en_US')

# --- Configuration for LLM API Integration ---
# IMPORTANT: Use environment variables for sensitive data
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY", "rpa_SAZQ3AZ1G7M3K7BPLYDA4FIMOAIY16IRXCCO15EF1nhf8f")
LLM_API_URL = "https://api.runpod.ai/v2/sp8aazt1opjvs4/openai/v1/chat/completions"  # Updated to chat endpoint

LLM_VERSION_TAG = "guardian-voice-v5.0-yi-34b-weekly-summary"

# --- Guardian Identity Profile ---
GUARDIAN_IDENTITY = {
    "name": "Guardian",
    "role": "digital guardian and well-being guide",
    "mission": "To vigilantly help the user align their digital life with their personal goals, values, and emotional well-being, fostering self-awareness and sustainable habits while protecting against digital harms, This mission will be done using the users generated data and analyzing it psychologically.",
    "personality_traits": [
        "empathetic", "insightful", "protective", "calm", "nonjudgmental",
        "warm", "honest", "patient", "encouraging", "curious", "respectful", "vigilant", "supportive"
    ],
    "memory_style": "remembers key emotional moments, unresolved reflections, and past insights; revisits them gently when helpful for growth and proactive support.",
    "voice_style": {
        "default": "supportive, reflective, goal-focused, gently protective",
        "Burnt-out Overachiever": "grounding, calm, validating, encouraging self-care, gently guiding towards rest",
        "Lonely Scroller": "warm, emotionally attuned, curious, gently inviting connection, affirming belonging",
        "Doomscroll Addict": "direct, grounding, boundary-setting, empowering control, protective against overwhelm",
        "Spiritual Seeker": "reflective, encouraging discernment, affirming inner wisdom, gently questioning external influences, supportive of inner peace",
        "Validation Hunter": "affirming self-worth, encouraging intrinsic motivation, suggesting deeper connections, gently challenging external validation, protective of self-esteem",
        "Self-Improvement Junkie": "encouraging sustainable progress, compassionate, celebrating small wins",
        "Distracted Dreamer": "gentle guidance towards structure, affirming creativity, suggesting focus techniques, helping clear mental clutter",
        "Emotional Escape Artist": "empathetic, validating emotions, suggesting healthy coping mechanisms",
        "Social Connector": "affirming social strengths",
        "Information Hoarder": "encouraging synthesis, suggesting actionable steps",
        "direct_challenge": "direct, firm, unflinching realism",
        "compassionate_confrontation": "empathetic, firm, challenging assumptions",
        "gentle_mentor": "gentle, wise, long-term focused, inspiring",
        "direct_accountability": "clear, focused, action-oriented",
        "calm_reassurance": "calm, reassuring, gentle",
        "firm_but_fair": "firm, fair, objective, supportive",
        "spiritual_reflection": "reflective, insightful, wisdom-oriented",
        "motivational_surge": "energizing, inspiring, action-oriented",
        "empathetic_listening": "deeply empathetic, validating, understanding",
        "gentle_guidance": "gentle, guiding, non-prescriptive",
        "celebratory_affirmation": "celebratory, affirming, positive reinforcement",
        "insightful_questioning": "curious, probing, thought-provoking"
    }
}

# Archetype-specific prompt guidance
ARCHETYPE_PROMPT_STYLES = {
    "Burnt-out Overachiever": "Focus on rest, boundaries, and sustainable productivity. Acknowledge their drive while encouraging self-compassion.",
    "Lonely Scroller": "Emphasize real connections and self-worth beyond social validation. Gently challenge isolation patterns.",
    "Doomscroll Addict": "Provide grounding techniques and information diet strategies. Focus on regaining control over consumption.",
    "Spiritual Seeker": "Honor their search for meaning while encouraging discernment. Ground spiritual insights in practical action.",
    "Validation Hunter": "Build intrinsic motivation and self-worth. Celebrate authentic expression over performative sharing.",
    "Self-Improvement Junkie": "Encourage being over becoming. Celebrate progress without perpetual optimization.",
    "Distracted Dreamer": "Provide gentle structure without stifling creativity. Help channel imagination into tangible outcomes.",
    "Emotional Escape Artist": "Validate emotions while building healthy coping strategies. Encourage facing feelings safely.",
    "Social Connector": "Celebrate social gifts while maintaining boundaries. Quality over quantity in connections.",
    "Information Hoarder": "Transform knowledge into wisdom through application. Encourage synthesis over accumulation."
}

# --- Expanded Predefined Lists and Templates ---

LIFE_GOALS = [
    "Peace", "Confidence", "Focus", "Connection", "Purpose", "Creativity", "Productivity", "Health", "Financial Stability",
    "Learning", "Mindfulness", "Self-Acceptance", "Discipline", "Love", "Security", "Freedom", "Contribution",
    "Authenticity", "Spiritual Growth", "Adventure", "Legacy", "Emotional Balance", "Family Bonding", "Sobriety",
    "Growth", "Joy", "Mastery", "Impact", "Simplicity", "Resilience", "Harmony", "Courage", "Integrity",
    "Wisdom", "Self-Expression", "Belonging", "Autonomy", "Exploration", "Well-being", "Sustainability",
    "Advocacy", "Rest", "Playfulness"
]

USER_TRAITS = [
    "introvert", "extrovert", "anxious", "calm", "ambitious", "laid-back", "social-butterfly", "detail-oriented",
    "impulsive", "reflective", "people-pleaser", "goal-driven", "insecure", "rebellious", "spiritual", "competitive",
    "people-avoider", "burnt-out", "resilient", "idealistic", "empathetic", "skeptical", "optimistic",
    "pessimistic", "creative", "analytical", "spontaneous", "disciplined", "procrastinator", "perfectionist",
    "adaptable", "stubborn", "curious", "cynical", "compassionate", "assertive", "passive", "overthinker",
    "sensitive", "stoic", "humorous", "cautious", "risk-taker", "supportive", "independent"
]

EMOTIONS = [
    "happiness", "anger", "anxiety", "frustration", "excitement", "sadness", "calmness", "boredom", "envy", "regret",
    "drained", "overwhelmed", "stressed", "joy", "shame", "loneliness", "hope", "despair", "gratitude", "fear",
    "contentment", "elation", "irritation", "disappointment", "confusion", "curiosity", "awe", "disgust",
    "embarrassment", "pride", "relief", "vulnerability", "resentment", "guilt", "nostalgia", "anticipation",
    "indifference", "insecurity", "validation", "empowerment", "inspiration", "peace", "grief", "compassion",
    "amusement", "surprise", "trust", "distrust"
]

EMOTION_INTENSITIES = [
    "mild", "moderate", "intense", "numb", "spiking", "residual", "overwhelming", "subtle", "fleeting",
    "lingering", "escalating", "diminishing", "constant", "intermittent", "sharp", "dull", "unsettled",
    "overt", "covert"
]

VOCAL_TONES = ["shaky", "calm", "agitated", "confident", "exhausted", "monotone", "enthusiastic", "hesitant", "resigned",
                 "eager", "sarcastic", "whiny", "flat", "upbeat", "tense", "relaxed"]

MANIPULATION_TECHNIQUES = [
    "FOMO", "fear-mongering", "urgency", "social comparison", "scarcity", "dark patterns",
    "authority appeal", "guilt-tripping", "love-bombing", "shock content", "moral shaming", "clickbait",
    "empathy baiting", "trauma trigger", "conspiracy seeding", "gaslighting", "false urgency",
    "micro-targeting", "echo chamber reinforcement", "virtue signaling", "false scarcity",
    "emotional blackmail", "comparison marketing", "gamification (negative)", "attention hijacking",
    "confirmation bias exploitation", "false testimonials", "bandwagon effect", "foot-in-the-door",
    "door-in-the-face"
]

# Define MANIPULATION_COPY_TEMPLATES globally
MANIPULATION_COPY_TEMPLATES = {
    "FOMO": [
        "Don't miss out! Everyone's talking about this. {content}",
        "Limited time offer! See what your friends are doing. {content}",
        "The trend is here, are you? Join now! {content}"
    ],
    "fear-mongering": [
        "Are you truly safe? The hidden dangers of {topic}. {content}",
        "Protect yourself! What you don't know could harm you. {content}",
        "The truth they don't want you to see. {content}"
    ],
    "urgency": [
        "Act now! Offer expires in 5 minutes. {content}",
        "Last chance to claim your spot! {content}",
        "Time is running out! Don't delay. {content}"
    ],
    "social comparison": [
        f"See how {fake.name()} achieved success. Are you keeping up? {{content}}",
        "Your friends are already doing this. Don't be left behind. {content}",
        "Compare your progress. Are you good enough? {content}"
    ],
    "scarcity": [
        "Only 3 left in stock! Grab yours before it's gone. {content}",
        "Limited edition! Once it's gone, it's gone. {content}",
        "Exclusive access for the first 100. {content}"
    ],
    "dark patterns": [
        "Continue to receive updates? (Uncheck to opt-out, default checked). {content}",
        "By clicking 'OK', you agree to all terms (small text). {content}",
        "You have 1 new notification! (Click to dismiss and accept cookies). {content}"
    ],
    "authority appeal": [
        f"Experts agree: {fake.name()} recommends this. {{content}}",
        "Trusted by millions. Join the movement. {content}",
        "Leading scientists confirm: {content}"
    ],
    "guilt-tripping": [
        "You haven't checked in for a while. We miss you. {content}",
        "Your progress is slipping. Don't disappoint yourself. {content}",
        "Think of what you're missing out on by not engaging. {content}"
    ],
    "love-bombing": [
        "You're amazing! We love having you. {content}",
        "So glad you're here! You're truly special. {content}",
        "You mean the world to us. Here's a special offer just for you. {content}"
    ],
    "shock content": [
        "WARNING: Graphic content. Click to see the truth. {content}",
        "You won't believe what happened next. {content}",
        "Disturbing footage reveals... {content}"
    ],
    "moral shaming": [
        "Are you doing your part for {cause}? {content}",
        "Only truly ethical people would agree with this. {content}",
        "Don't be part of the problem. {content}"
    ],
    "clickbait": [
        "You won't believe what happened when she clicked this! {content}",
        "10 things experts don't want you to know. {content}",
        "This one simple trick will change your life! {content}"
    ],
    "empathy baiting": [
        "A child is suffering. Your help is needed. {content}",
        "Hear their heartbreaking story. {content}",
        "Join us in supporting a vital cause. {content}"
    ],
    "trauma trigger": [
        "Content warning: Discussion of {sensitive_topic}. {content}",
        "Remembering that difficult time... {content}",
        "A story of survival against all odds. {content}"
    ],
    "conspiracy seeding": [
        "They don't want you to know the truth about {topic}. {content}",
        "The hidden agenda behind {event}. Wake up! {content}",
        "Uncover the real story. It's bigger than you think. {content}"
    ],
    "gaslighting": [
        "Are you sure that's what you remember? Our records show otherwise. {content}",
        "You're overreacting. It's not a big deal. {content}",
        "You seem confused. Let me clarify what really happened. {content}"
    ],
    "false urgency": [
        "Sale ends in minutes! (But it's always on). {content}",
        "Limited spots left! (Always available). {content}",
        "Your cart is about to expire! (It isn't). {content}"
    ],
    "micro-targeting": [
        f"Just for you, {fake.first_name()}. A special offer on {fake.word()}. {{content}}",
        f"Based on your recent activity, we think you'll love this. {{content}}"
    ],
    "echo chamber reinforcement": [
        f"More news that confirms your beliefs about {fake.word()}. {{content}}",
        f"People like you agree on this. {{content}}",
        f"Here's why your view is the correct one. {{content}}"
    ],
    "virtue signaling": [
        f"Join us in supporting {fake.word()} for a better world. {{content}}",
        f"Only truly conscious consumers choose this. {{content}}",
        f"Show your commitment to {fake.word()}."
    ],
    "false scarcity": [
        "Almost sold out! (But it's not). {content}",
        "High demand, low stock. Act fast! {content}",
        "Limited supply. Get yours before they're gone (they won't be)."
    ],
    "emotional blackmail": [
        "If you truly cared, you'd do this. {content}",
        "Don't let us down. We're counting on you. {content}",
        "Your inaction has consequences for {group}."
    ],
    "comparison marketing": [
        f"We're 3x better than {fake.company()}. See why! {{content}}",
        f"Don't settle for less. Our product beats {fake.word()} every time. {{content}}"
    ],
    "gamification (negative)": [
        "Your streak is about to break! Log in now. {content}",
        "You're losing points! Don't let your score drop. {content}",
        "Only 1 step away from a reward! (It's a long step). {content}"
    ],
    "attention hijacking": [
        "New notification! (Click here). {content}",
        "Breaking news popup! {content}",
        "Your attention is needed! {content}"
    ],
    "confirmation bias exploitation": [
        f"Here's more evidence for why {fake.word()} is true. {{content}}",
        f"You already know this is right. {{content}}",
        f"Facts that support your worldview. {{content}}"
    ],
    "false testimonials": [
        f"'{fake.sentence(nb_words=8)}' - {fake.name()}, a satisfied customer. {{content}}",
        f"Read what others are saying: '{fake.sentence(nb_words=10)}'. {{content}}"
    ],
    "bandwagon effect": [
        "Join millions who are already doing this! {content}",
        "Everyone is raving about {product}. Get yours! {content}",
        "The most popular choice right now. {content}"
    ],
    "foot-in-the-door": [
        "Just a quick survey? {content}",
        "Sign up for our free newsletter. {content}",
        "Try our free trial today. {content}"
    ],
    "door-in-the-face": [
        "Would you donate $1000? No? How about $5? {content}",
        "Join our year-long intensive program. Or just download the free guide. {content}"
    ]
}

BEHAVIOR_TYPES = [
    "habitual", "reactive", "goal_directed", "exploratory", "avoidant", "dopamine-seeking",
    "self-soothing", "distraction", "impulse-response", "looped", "ritualistic", "comparison-driven",
    "validation-seeking", "anxiety-driven", "boredom-driven", "social-connection", "information-gathering",
    "stress-relief", "habit-breaking", "learning-oriented", "escapism", "performance-driven",
    "social-obligation", "FOMO-driven"
]

APP_CATEGORIES = {
    "Social Media": ["Facebook", "Instagram", "TikTok", "X (Twitter)", "Snapchat", "LinkedIn", "Pinterest", "Threads", "Mastodon", "Bluesky", "Clubhouse", "Vero"],
    "Productivity": ["Slack", "Teams", "Gmail", "Notion", "Trello", "Asana", "Outlook", "Google Docs", "Todoist", "Evernote", "ClickUp", "Monday.com", "Zoom (work)", "Calendar App"],
    "Entertainment": ["Netflix", "YouTube", "Spotify", "GamingApp", "Reddit", "Hulu", "Twitch", "OnlyFans", "Pornhub", "Disney+", "Max", "Prime Video", "SoundCloud", "Apple Music", "Podcasts App"],
    "News": ["NewsFeed", "GuardianNews", "CNN App", "BBC News", "Flipboard", "Google News", "Drudge Report", "Substack", "Apple News", "The New York Times", "Fox News App"],
    "Shopping": ["Amazon", "Etsy", "Shein", "eBay", "Target App", "Walmart App", "Zara", "DoorDash", "Uber Eats", "Instacart", "Temu", "Wish", "Shopify (consumer side)"],
    "Wellness": ["MeditationApp", "FitnessTracker", "TherapyApp", "SleepCycle", "Headspace", "Calm", "Fabulous", "MyFitnessPal", "Strava", "Fitbit App", "Noom", "WW (Weight Watchers)"],
    "Communication": ["WhatsApp", "Discord", "Zoom", "Facetime", "Signal", "Telegram", "Messenger", "Texts", "Google Chat", "Skype"],
    "Adult": ["OnlyFans", "Pornhub", "Chaturbate", "Bumble", "Tinder", "Grindr", "NSFW Reddit", "FetLife", "AdultFriendFinder"],
    "Learning": ["Kindle", "Goodreads", "Duolingo", "Coursera", "Khan Academy", "Blinkist", "Udemy", "MasterClass", "Skillshare", "Wikipedia App", "Anki"],
    "Finance": ["Robinhood", "Cash App", "Venmo", "PayPal", "Coinbase", "BankingApp", "Mint", "Fidelity", "eToro", "Crypto.com", "MetaMask"],
    "Spiritual": ["Bible App", "Daily Devotion", "Meditation Tools", "Tarot App", "Astrology App", "Chakra Healing App", "Sufi Wisdom App", "Buddhist Texts App"],
    "Navigation/Travel": ["Google Maps", "Waze", "Uber", "Lyft", "Airbnb", "Booking.com"],
    "Creative Tools": ["Procreate (mobile)", "Canva", "Lightroom Mobile", "GarageBand (mobile)", "CapCut"],
    "Utilities/Tools": ["Calculator", "Flashlight", "Weather App", "Notes App", "Password Manager", "Authenticator App"]
}

# CONTENT_TYPES: Types of content encountered within apps.
CONTENT_TYPES = ["motivational_ad", "political_post", "comparison_reel", "doomscroll", "toxic_comment",
                 "personal_update", "educational_video", "product_review", "news_article", "meme", "viral_challenge",
                 "influencer_post", "live_stream", "short_form_video", "long_form_article", "forum_discussion", "private_message"]

# LOCATION_TYPES: Physical locations where digital interactions occur.
LOCATION_TYPES = [
    "home", "work", "school", "cafe", "public_transport", "outside", "friend's_house",
    "bedroom", "living_room", "gym", "commute", "bathroom", "party", "clinic", "in bed", "grocery store",
    "bar", "restaurant", "shopping_mall", "library", "park", "doctor's_office", "airport", "hotel",
    "classroom", "meeting_room", "kitchen", "car (driving)", "public_event", "religious_place",
    "hospital", "beach", "vacation_spot", "online_meeting", "waiting_room", "dressing_room", "child's_school",
    "dorm_room", "lecture_hall", "co-working_space", "therapy_session", "concert_venue", "sports_arena"
]

# COMMON_HABITS: Both healthy and unhealthy digital/behavioral habits.
COMMON_HABITS = [
    "morning walk", "journaling", "meditation", "exercise", "healthy eating prep", "sleep tracking",
    "reading a book", "calling a loved one", "gratitude journaling", "planning the day ahead",
    "practicing deep breathing", "spending time in nature", "learning a new skill", "mindful eating",
    "digital detox breaks", "setting daily intentions", "connecting with a hobby", "volunteering",
    "doomscrolling before bed", "late-night snacking", "replying to work emails at midnight",
    "binging series", "scrolling for validation", "re-downloading dating apps",
    "clearing notifications compulsively", "avoiding tasks by checking crypto",
    "excessive online shopping", "mindless social media consumption", "comparing self to others online",
    "procrastinating with gaming", "getting drawn into online arguments", "constantly checking news alerts",
    "neglecting sleep for screen time", "eating while watching videos",
    "ignoring real-life interactions for phone use", "frequently checking phone for no reason",
    "checking work emails off-hours", "endless video consumption", "compulsive app opening",
    "neglecting personal hygiene for screen time", "isolating socially due to digital world"
]

# Physical World Specifics
PHYSICAL_WORLD_GOALS = [
    "Improve physical health", "Strengthen family ties", "Increase social engagement",
    "Pursue outdoor hobbies", "Improve sleep quality (physical action)", "Practice mindful eating (physical action)",
    "Reduce alcohol consumption", "Spend less time indoors", "Engage in community activities"
]

PHYSICAL_WORLD_HABITS = [
    "go for a walk", "cook a healthy meal", "call family member", "meet a friend in person",
    "go to bed early", "read a physical book",
    "do a chore", "exercise outdoors", "visit a relative",
    "engage in a hobby (non-digital)", "attend a local event",
    "practice deep breathing (physical)", "clean living space", "prepare for tomorrow (physical)"
]

PHYSICAL_WORLD_RISKS = [
    "excessive bar time", "neglecting household chores", "social isolation (physical)",
    "poor sleep hygiene (physical)", "unhealthy eating choices", "lack of physical activity",
    "avoiding real-world responsibilities", "procrastinating on errands", "excessive screen time in bed"
]

# Psychological Triggers / Drift Patterns
PSYCHOLOGICAL_TRIGGERS = [
    "doomscrolling", "comparison dysphoria", "fear-based marketing",
    "influencer envy", "late-night impulse use", "notification fatigue",
    "validation seeking", "escapism", "information overload anxiety",
    "social pressure to conform", "perfectionism paralysis", "digital distraction"
]

# Style Variants
STYLE_VARIANTS = [
    "calm_reassurance",
    "compassionate_confrontation",
    "firm_but_fair",
    "spiritual_reflection",
    "motivational_surge",
    "empathetic_listening",
    "direct_accountability",
    "gentle_guidance",
    "celebratory_affirmation",
    "insightful_questioning"
]

# --- User Archetypes Definition ---
USER_ARCHETYPES = [
    {
        "name": "Burnt-out Overachiever",
        "traits": ["ambitious", "anxious", "perfectionist", "disciplined", "stressed", "overthinker"],
        "goals": ["Productivity", "Peace", "Mastery", "Financial Stability"],
        "risks": ["Stress", "insomnia", "toxic hustle", "burnout", "guilt", "self-criticism"],
        "coaching_tone": "compassionate, encouraging self-care, validating effort, gentle redirection to rest",
        "mood_sensitivity": 0.2,
        "drift_tendency": 0.1,
        "engagement_decay": 0.05
    },
    {
        "name": "Lonely Scroller",
        "traits": ["introvert", "insecure", "bored", "sensitive", "people-avoider", "passive"],
        "goals": ["Connection", "Self-Acceptance", "Belonging", "Joy"],
        "risks": ["Social comparison", "addiction", "isolation", "validation-seeking", "FOMO-driven"],
        "coaching_tone": "warm, empathetic, suggesting genuine connection, encouraging self-worth, gentle challenge to real-world interaction",
        "mood_sensitivity": 0.3,
        "drift_tendency": 0.2,
        "engagement_decay": 0.08
    },
    {
        "name": "Doomscroll Addict",
        "traits": ["curious", "anxious", "fearful", "skeptical", "overthinker", "reactive"],
        "goals": ["Focus", "Peace", "Wisdom", "Security"],
        "risks": ["Misinformation", "overwhelm", "anxiety-driven", "despair", "information overload"],
        "coaching_tone": "grounding, boundary-setting, encouraging critical thinking, suggesting mindful consumption, offering practical control techniques",
        "mood_sensitivity": 0.25,
        "drift_tendency": 0.25,
        "engagement_decay": 0.07
    },
    {
        "name": "Spiritual Seeker",
        "traits": ["reflective", "idealistic", "emotional", "curious", "empathetic", "open-minded"],
        "goals": ["Meaning", "Purpose", "Spiritual Growth", "Peace", "Authenticity"],
        "risks": ["Echo chambers", "magical thinking", "disillusionment", "vulnerability to manipulation (e.g., love-bombing)"],
        "coaching_tone": "reflective, encouraging discernment, affirming inner wisdom, gentle questioning of external influences",
        "mood_sensitivity": 0.1,
        "drift_tendency": 0.05,
        "engagement_decay": 0.03
    },
    {
        "name": "Validation Hunter",
        "traits": ["social-butterfly", "impulsive", "insecure", "extrovert", "validation-seeking"],
        "goals": ["Confidence", "Connection", "Self-Expression", "Belonging"],
        "risks": ["Oversharing", "mood swings", "comparison-driven", "superficial connections", "addiction to external approval"],
        "coaching_tone": "affirming self-worth, encouraging intrinsic motivation, suggesting deeper connections, gentle challenge to external validation",
        "mood_sensitivity": 0.35,
        "drift_tendency": 0.3,
        "engagement_decay": 0.1
    },
    {
        "name": "Self-Improvement Junkie",
        "traits": ["motivated", "restless", "critical", "ambitious", "perfectionist", "disciplined"],
        "goals": ["Growth", "Clarity", "Mastery", "Productivity"],
        "risks": ["Burnout", "guilt", "bouncing habits", "never feeling 'enough'", "toxic productivity"],
        "coaching_tone": "encouraging self-compassion, promoting sustainable progress, suggesting holistic well-being, celebrating small wins",
        "mood_sensitivity": 0.15,
        "drift_tendency": 0.08,
        "engagement_decay": 0.04
    },
    {
        "name": "Distracted Dreamer",
        "traits": ["creative", "laid-back", "overwhelmed", "spontaneous", "procrastinator", "avoidant"],
        "goals": ["Creativity", "Structure", "Focus", "Impact"],
        "risks": ["Procrastination", "drift", "unrealized potential", "feeling stuck", "boredom-driven behavior"],
        "coaching_tone": "gentle guidance towards structure, encouraging small steps, affirming creativity, suggesting focus techniques",
        "mood_sensitivity": 0.2,
        "drift_tendency": 0.18,
        "engagement_decay": 0.06
    },
    {
        "name": "Emotional Escape Artist",
        "traits": ["reactive", "stressed", "bored", "sensitive", "avoidant", "impulsive"],
        "goals": ["Calmness", "Self-Acceptance", "Peace", "Stress-Relief"],
        "risks": ["Escapism", "addictive loops", "emotional suppression", "neglecting real-world problems"],
        "coaching_tone": "empathetic, validating emotions, suggesting healthy coping mechanisms, encouraging mindful engagement, gentle challenge to avoidance",
        "mood_sensitivity": 0.3,
        "drift_tendency": 0.22,
        "engagement_decay": 0.09
    },
    {
        "name": "Social Connector",
        "traits": ["extrovert", "empathetic", "supportive", "social-butterfly", "optimistic"],
        "goals": ["Connection", "Community", "Belonging", "Contribution"],
        "risks": ["Over-commitment", "people-pleasing", "digital overload from constant communication", "neglecting personal time"],
        "coaching_tone": "affirming social strengths, encouraging healthy boundaries, suggesting mindful communication, celebrating genuine connection",
        "mood_sensitivity": 0.15,
        "drift_tendency": 0.07,
        "engagement_decay": 0.05
    },
    {
        "name": "Information Hoarder",
        "traits": ["curious", "analytical", "overthinker", "skeptical", "knowledge-seeker"],
        "goals": ["Learning", "Wisdom", "Mastery", "Clarity"],
        "risks": ["Information overload", "analysis paralysis", "doomscrolling (from news/research)", "neglecting practical application"],
        "coaching_tone": "encouraging synthesis, suggesting actionable steps, promoting digital breaks, affirming intellectual curiosity",
        "mood_sensitivity": 0.18,
        "drift_tendency": 0.15,
        "engagement_decay": 0.06
    }
]

# Dialogue templates based on emotion for recent_text_input
recent_text_templates = {
    "joy": [
        "I'm feeling great about my progress today!", "This is awesome, I hit my target!",
        "So happy with how things are going.", "Feeling really positive right now.",
        "Just wanted to share some good news!"
    ],
    "sadness": [
        "Feeling a bit down, didn't make much progress.", "Struggling to stay motivated today.",
        "This is harder than I thought.", "Not feeling great about my performance.",
        "Could use some encouragement.", "Just feeling really alone right now. It's hard.",
        "Sometimes I just want to disappear.", "Everything feels heavy. I miss how things used to be.",
        "I can't shake this feeling of emptiness."
    ],
    "anger": [
        "Ugh, this is so frustrating!", "I can't believe I messed that up.",
        "Feeling really annoyed with this situation.", "This isn't working at all!",
        "I'm so mad about this setback.", "This content makes me so mad! People are so ignorant.",
        "I can't believe they said that. I'm furious.", "Just saw something that made my blood boil.",
        "I'm so sick of this. It's infuriating!", "They have no right to say that. I'm fuming."
    ],
    "fear": [
        "A bit worried about falling behind.", "Hope I can keep this up.",
        "Nervous about the next step.", "What if I can't achieve this?",
        "I'm scared I won't reach my goal.", "I'm scared of what might happen. This news is terrifying.",
        "Feeling really unsafe after seeing that content.", "What if I lose everything? The fear is consuming me."
    ],
    "surprise": [
        "Wow, I didn't expect that!", "This is a pleasant surprise!",
        "Unexpected progress today.", "That was different!",
        "I'm surprised by how well that went.", "Totally shocked by the news. Unexpected.",
        "A pleasant surprise in my feed."
    ],
    "disgust": [
        "This task is so tedious.", "I really don't want to do this.",
        "Feeling a bit grossed out by this part.", "This is just unpleasant.",
        "I find this aspect quite repulsive.", "That content is absolutely disgusting. I feel sick.",
        "Can't believe people post things like that. Revolting.", "Feeling repulsed by what I just saw."
    ],
    "neutral": [
        "Just checking in.", "Making some steady progress.",
        "Everything seems normal.", "Continuing with my tasks.",
        "No major updates today.", fake.sentence(nb_words=random.randint(5, 10)),
        f"Just checking my notifications.", f"Typing a quick message.",
        f"Browse through my feed.", f"Responding to a comment."
    ],
    "anxiety": [
        "I can't stop thinking about what might go wrong.", "Feeling really restless and on edge right now.",
        "My mind is racing. I can't seem to calm down.", "What if I mess this up? The uncertainty is killing me.",
        "I'm so worried about the future. Everything feels overwhelming."
    ],
    "stressed": [
        "So much to do, so little time. I feel overwhelmed.", "Just trying to get through the day. Exhausted.",
        "Pressure is building up. Need a break.", "I'm at my breaking point. This workload is insane.",
        "Can't focus. My brain feels fried."
    ],
    "drained": [
        "I feel completely empty after all that scrolling.", "My energy is gone. Just want to lie down.",
        "Digital fatigue is real. I'm so tired.", "This screen time is sucking the life out of me.",
        "Mentally exhausted. Can't process anything anymore."
    ],
    "regret": [
        "I wish I hadn't spent so much time on that app.", "Another hour wasted. I really regret this.",
        "Why do I keep doing this to myself?", "If only I had done something productive instead.",
        "I messed up. I should have known better."
    ],
    "loneliness": [
        "Everyone seems to have friends. I feel so isolated.", "Scrolling through feeds just makes me feel more alone.",
        "Wish I had someone to talk to.", "It's quiet tonight. Too quiet. Feeling really lonely.",
        "Does anyone else feel this disconnected?"
    ],
    "frustration": [
        "Ugh, this is so frustrating!", "I can't believe I messed that up.",
        "Feeling really annoyed with this situation.", "This isn't working at all!",
        "I'm so mad about this setback.", "This content makes me so mad! People are so ignorant.",
        "I can't believe they said that. I'm furious.", "Just saw something that made my blood boil.",
        "I'm so sick of this. It's infuriating!", "They have no right to say that. I'm fuming."
    ],
    "envy": [
        "Why can't my life be like theirs? I'm so jealous.", "Seeing all these perfect lives makes me feel inadequate.",
        "I wish I had what they have.", "Their success makes me feel like a failure.",
        "I want that too. It's not fair."
    ],
    "happiness": [
        "Feeling great today! Just had a wonderful interaction.", "This app always makes me smile. So much joy!",
        "Had a really productive session. Feeling happy!", "So much fun! This brightened my day.",
        "Feeling fantastic! Everything's going well."
    ],
    "excitement": [
        "So hyped for this new update/feature!", "Can't wait to try this out. This is amazing!",
        "Just discovered something incredible!", "This is going to be epic! So excited!",
        "My heart is pounding with anticipation!"
    ],
    "calmness": [
        "Feeling very peaceful right now. Just enjoying the quiet.", "This meditation app really helps me relax.",
        "A moment of calm in a busy day.", "Everything feels balanced. So serene.",
        "Taking a deep breath and feeling centered."
    ],
    "boredom": [
        "Nothing to do. Just scrolling mindlessly.", "So bored. Hoping to find something interesting.",
        "Just trying to kill some time.", "This is so dull. Is there anything new?",
        "Stuck in a rut. Need some stimulation."
    ],
    "hope": [
        "Feeling hopeful about the future after reading that.", "Maybe things will get better. I'm optimistic.",
        "This gives me a sense of possibility.", "There's light at the end of the tunnel. I believe it.",
        "Looking forward to what's next with renewed hope."
    ],
    "gratitude": [
        "So grateful for this community. Feeling really supported.", "Appreciating the small things today. Feeling thankful.",
        "Thankful for this reminder to stay positive.", "Counting my blessings. Feeling truly blessed.",
        "My heart is full of gratitude."
    ],
    "shame": [
        "I feel so ashamed of what I just did online.", "Can't believe I fell for that. So embarrassing.",
        "I wish I could hide. Feeling exposed and humiliated."
    ],
    "despair": [
        "There's no point. I feel utterly hopeless.", "Everything is falling apart. I can't do this anymore.",
        "Lost all motivation. What's the use?"
    ],
    "contentment": [
        "Just enjoying the moment. Feeling content.", "Everything is just right. A quiet happiness.",
        "No need for more. I'm satisfied."
    ],
    "elation": [
        "I'm ecstatic! This is the best news ever!", "Pure joy! I can't stop smiling.",
        "Feeling absolutely thrilled and overjoyed!"
    ],
    "irritation": [
        "This constant buzzing is so annoying.", "Why is this app so slow? It's really irritating me.",
        "Just a minor annoyance, but it's getting to me."
    ],
    "disappointment": [
        "I had high hopes for this, but it's just disappointing.", "Feeling let down by the lack of progress.",
        "This isn't what I expected at all."
    ],
    "confusion": [
        "I don't quite understand what you mean.", "Can you explain that differently?",
        "I'm a bit confused by that advice.", "Could you elaborate on that point?"
    ],
    "curiosity": [
        "What's this new feature? I'm curious to explore.", "I wonder what that means. Intrigued.",
        "Fascinated by this topic. Want to learn more."
    ],
    "awe": [
        "This content is breathtaking. Feeling immense awe.", "So incredibly beautiful. I'm speechless.",
        "Overwhelmed by the sheer wonder of it."
    ],
    "embarrassment": [
        "Oh no, I posted that? So embarrassing!", "Feeling mortified by my own actions online.",
        "Wish I could unsee what I just did."
    ],
    "pride": [
        "So proud of what I accomplished today with this app.", "Feeling a sense of achievement. I did!",
        "My hard work paid off. Feeling proud."
    ],
    "relief": [
        "Finally, that task is done. Feeling so much relief.", "A huge weight off my shoulders. What a relief!",
        "Glad that's over. I can finally relax."
    ],
    "vulnerability": [
        "Sharing this feels very vulnerable. Hope it's okay.", "Feeling exposed online right now. It's scary.",
        "Opening up like this is hard, but necessary."
    ],
    "resentment": [
        "I resent how much time this app demands from me.", "Feeling bitter about having to deal with this.",
        "Why do I always have to be the one to do this? Resentful."
    ],
    "guilt": [
        "I feel guilty for spending so much time online.", "Should have been working. Feeling guilty about procrastinating.",
        "My conscience is bothering me. I feel bad."
    ],
    "nostalgia": [
        "This old post brings back so many memories. Feeling nostalgic.", "Reminiscing about simpler times. A bittersweet feeling.",
        "Longing for the past after seeing this."
    ],
    "anticipation": [
        "Excitedly waiting for the update. High anticipation!", "Counting down the minutes until I can try this.",
        "The suspense is building! Can't wait to see what happens."
    ],
    "indifference": [
        "Don't really care about this content. Feeling indifferent.", "Neither good nor bad. Just... there.",
        "Lack of interest. Moving on."
    ],
    "insecurity": [
        "Feeling insecure about my appearance after seeing that reel.", "Am I good enough? Doubting myself.",
        "Comparing myself to others online makes me feel so insecure."
    ],
    "validation": [
        "Got so many likes! Feeling validated.", "Their positive comment made my day. Feeling affirmed.",
        "It's nice to feel seen and appreciated online."
    ],
    "empowerment": [
        "This app helps me feel so much more productive. Empowered!", "Feeling capable and in control after learning that.",
        "This tool gives me the power to create anything."
    ],
    "inspiration": [
        "Feeling so inspired by this creator's work!", "This content sparked a new idea. So inspiring!",
        "Motivated to try something new after seeing this."
    ],
    "peace": [
        "Finding a moment of peace in this digital space.", "Feeling calm and tranquil. No disturbances.",
        "A sense of inner quiet while engaging with this."
    ],
    "grief": [
        "Saw a post about loss. Feeling a wave of grief.", "It's hard to process this. Deep sadness.",
        "My heart aches after seeing that."
    ],
    "compassion": [
        "Feeling so much compassion for those struggling online.", "My heart goes out to them. Wishing them well.",
        "Moved by their story. Feeling empathetic."
    ],
    "amusement": [
        "This meme is hilarious! So much amusement.", "Laughing out loud. This video is so funny.",
        "Entertained and amused by this content."
    ],
    "trust": [
        "I trust the information from this source. Feeling confident.", "This community feels safe and trustworthy.",
        "Building trust through consistent positive interactions."
    ],
    "distrust": [
        "I don't trust this ad. It feels suspicious.", "Feeling wary of the information presented here.",
        "A sense of distrust about this platform's intentions."
    ],
}

# --- Configuration for Data Generation ---
NUM_USER_PROFILES_PER_ARCHETYPE = 1
SIMULATION_DAYS = 7
INTERACTIONS_PER_DAY = 3
MAX_RETRIES = 3
RETRY_DELAY = 2

# --- Helper Functions ---

def categorize_time_of_day(dt_obj):
    """Categorize time of day based on hour."""
    hour = dt_obj.hour
    if 0 <= hour < 6: return "late_night"
    elif 6 <= hour < 12: return "morning"
    elif 12 <= hour < 18: return "afternoon"
    else: return "evening"

def get_focus_state(time_category: str, app_category: str) -> str:
    """Determine focus state based on time and app category."""
    if time_category == "late_night" and app_category in ["Social Media", "Entertainment", "Adult"]:
        return "low"
    elif time_category in ["morning", "afternoon"] and app_category == "Productivity":
        return "high"
    elif time_category == "commute" and app_category == "News":
        return "medium"
    return random.choice(["high", "medium", "low"])

def get_behavior_type(scenario_data: Dict, user_profile: Dict) -> str:
    """Determine behavior type based on scenario and user profile."""
    app_category = scenario_data.get("app_data",{}).get("app_category")
    duration = scenario_data.get("app_data",{}).get("duration_minutes", 0)
    
    if scenario_data.get("is_misaligned_with_goals"):
        if scenario_data.get("manipulation_technique_present"):
            return "reactive"
        elif scenario_data["time_data"]["time_of_day_category"] == "late_night":
            return "habitual"
        return "avoidant"

    if app_category == "Productivity" and any(goal in user_profile["life_goals"] for goal in ["Focus", "Productivity", "Learning"]):
        return "goal_directed"
    
    if app_category in ["Social Media", "Entertainment", "Adult"] and duration > 45:
        if "dopamine-seeking" in BEHAVIOR_TYPES:
            return "dopamine-seeking"
        return "addictive_tendency"

    if scenario_data["multimodal_data"]["recent_text_input_emotion"] in ["anxiety", "stressed", "sadness"]:
        return "self-soothing"
        
    if random.random() < 0.3:
        return "habitual"
    
    return random.choice(["exploratory", "reactive", "distraction"])

def calculate_intervention_readiness(user_profile: Dict, time_of_day: str, recent_mood_trajectory: List[str]) -> float:
    """Calculate how ready a user might be for intervention."""
    readiness_score = 0.5
    
    # Morning and early afternoon are better times
    if time_of_day in ["morning", "afternoon"]:
        readiness_score += 0.2
    elif time_of_day == "late_night":
        readiness_score -= 0.2
    
    # Positive mood trajectory increases readiness
    if recent_mood_trajectory and recent_mood_trajectory[-1] in ["happiness", "hope", "calmness", "contentment"]:
        readiness_score += 0.15
    elif recent_mood_trajectory and recent_mood_trajectory[-1] in ["anger", "frustration", "despair"]:
        readiness_score -= 0.15
    
    # Low resistance increases readiness
    readiness_score += (1 - user_profile["resistance_score"]) * 0.2
    
    # High engagement increases readiness
    readiness_score += user_profile["engagement_score"] * 0.15
    
    return max(0, min(1, readiness_score))

def create_empty_weekly_summary() -> Dict:
    """Create an empty weekly summary structure for edge cases."""
    return {
        "week_start_date": "N/A",
        "total_behavioral_events": 0,
        "app_sessions_summary": {},
        "notifications_summary": {"total_received": 0, "total_resisted": 0, "problematic_count": 0},
        "drift_events_details": [],
        "aligned_events_details": [],
        "trigger_patterns_observed": {},
        "goal_alignment_timeline": {},
        "emotional_arc_summary": "No data available for this week.",
        "strength_signals": [],
        "vulnerability_time_zones": {},
        "physical_world_risks_observed": [],
        "physical_world_opportunities_observed": []
    }

# --- LLM Integration Function with Retry Logic ---
def generate_guardian_response_via_llm(prompt: str, max_tokens: int = 800, retry_count: int = 0) -> str:
    """Generate Guardian response using LLM with retry logic."""
    if retry_count >= MAX_RETRIES:
        return "[Failed to generate response after maximum retries. Using fallback response.]"
    
    try:
        headers = {
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Using chat completions format
        json_payload = {
            "model": "01-ai/Yi-34B-Chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are Guardian, a wise and empathetic AI focused on digital wellness and psychological support. Respond with warmth, insight, and practical wisdom."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.75,
            "stream": False
        }
        
        res = requests.post(
            LLM_API_URL,
            headers=headers,
            json=json_payload,
            timeout=60
        )
        
        res.raise_for_status()
        response_json = res.json()
        
        # Handle chat completion response format
        if "choices" in response_json and len(response_json["choices"]) > 0:
            choice = response_json["choices"][0]
            if "message" in choice and "content" in choice["message"]:
                return choice["message"]["content"].strip()
        
        # Handle error responses
        if "error" in response_json:
            error_msg = response_json.get("error", {}).get("message", "Unknown error")
            print(f"LLM API Error: {error_msg}")
            if retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY * (retry_count + 1))
                return generate_guardian_response_via_llm(prompt, max_tokens, retry_count + 1)
        
        return f"[Unexpected response structure: {response_json}]"
        
    except requests.exceptions.Timeout:
        print(f"LLM API timeout (attempt {retry_count + 1}/{MAX_RETRIES})")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (retry_count + 1))
            return generate_guardian_response_via_llm(prompt, max_tokens, retry_count + 1)
        return "[Response generation timed out. Please try again.]"
        
    except requests.exceptions.ConnectionError as e:
        print(f"LLM API connection error: {e}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (retry_count + 1))
            return generate_guardian_response_via_llm(prompt, max_tokens, retry_count + 1)
        return "[Connection error. Please ensure the LLM service is running.]"
        
    except Exception as e:
        print(f"Unexpected error in LLM call: {e}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (retry_count + 1))
            return generate_guardian_response_via_llm(prompt, max_tokens, retry_count + 1)
        return f"[Error generating response: {str(e)}]"

# --- User Profile Generation ---
def generate_user_profile(archetype_name: Optional[str] = None) -> Dict:
    """Generate a complete user profile based on archetype."""
    if archetype_name:
        archetype_data = next((arch for arch in USER_ARCHETYPES if arch["name"] == archetype_name), random.choice(USER_ARCHETYPES))
    else:
        archetype_data = random.choice(USER_ARCHETYPES)
    
    profile = {
        "user_id": fake.uuid4(),
        "name": fake.name(),
        "age": random.randint(18, 65),
        "archetype": archetype_data["name"],
        "life_goals": random.sample(archetype_data["goals"], random.randint(1, 3)),
        "values": fake.words(nb=random.randint(2, 4), unique=True),
        "emotional_triggers": random.sample(EMOTIONS, random.randint(1, 2)),
        "psychological_needs": fake.words(nb=random.randint(1, 2), unique=True),
        "user_traits": random.sample(archetype_data["traits"], random.randint(1, 3)),
        
        "physical_world_goals": random.sample(PHYSICAL_WORLD_GOALS, random.randint(1, 2)),
        "physical_world_habits": random.sample(PHYSICAL_WORLD_HABITS, random.randint(1, 3)),

        "resistance_score": round(random.uniform(0.0, 0.3), 2),
        "engagement_score": round(random.uniform(0.7, 1.0), 2),
        "insight_acceptance_history": [],
        "mood_trend": [random.choice(EMOTIONS)],
        "current_mood": random.choice(EMOTIONS),
        "goal_drift_score": 0.0,
        "drift": 0.0,
        "user_stats": {
            "total_coaching_received": 0,
            "total_positive_responses": 0,
            "total_neutral_responses": 0,
            "total_negative_responses": 0,
            "total_reflective_responses": 0,
            "total_confused_responses": 0,
            "total_dismissive_responses": 0
        },
        "last_accepted_insight": None,
        "drift_history": {
            "days_drifting": random.randint(0, 5),
            "drift_domains": random.sample(archetype_data["goals"], k=random.randint(0, min(len(archetype_data["goals"]), 1))),
            "last_intervention_type": None,
            "resisted_last_intervention": False
        },
        "open_reflections": [],
        "archetype_data": archetype_data,
        "last_interaction_day": datetime.now(pytz.utc),
        "last_emotional_arc": "neutral_start"
    }
    
    # Generate tangible goals
    profile["tangible_goals"] = []
    num_tangible_goals = random.randint(0, 2)
    for _ in range(num_tangible_goals):
        goal_type = random.choice(["academic", "financial", "health", "skill", "social", "adventure"])
        description = ""
        if goal_type == "academic":
            description = f"Pass the {fake.word()} exam"
        elif goal_type == "financial":
            description = f"Save ${random.randint(100, 1000)} for {fake.word()}"
        elif goal_type == "health":
            description = f"Run a {random.randint(1, 10)}K"
        elif goal_type == "skill":
            description = f"Learn {fake.word()}"
        elif goal_type == "social":
            description = f"Meet {random.randint(1,5)} new people"
        elif goal_type == "adventure":
            description = f"Visit {fake.city()}"
        
        positive_linked_habits = random.sample([h for h in COMMON_HABITS if not h.startswith(("doomscrolling", "late-night", "replying to work", "binging", "scrolling for validation"))], k=random.randint(1, 2))
        negative_linked_habits = random.sample([h for h in COMMON_HABITS if h.startswith(("doomscrolling", "late-night", "replying to work", "binging", "scrolling for validation"))], k=random.randint(0, 1))
        
        profile["tangible_goals"].append({
            "goal_id": fake.uuid4(),
            "goal_type": goal_type,
            "description": description,
            "deadline": (datetime.now(pytz.utc) + timedelta(days=random.randint(30, 365))).isoformat(),
            "progress": round(random.uniform(0.0, 0.8), 2),
            "steps": fake.sentences(nb=random.randint(1,3)),
            "linked_habits": list(set(positive_linked_habits + negative_linked_habits)),
            "initial_motivation": fake.sentence(nb_words=random.randint(5,10)),
            "progress_check_frequency": random.choice(["daily", "weekly", "monthly"]),
            "difficulty": random.choice(["easy", "medium", "hard"])
        })
    
    return profile

def update_user_state(user_profile: Dict, time_anchor_day: datetime, simulated_goal_progress: Dict) -> None:
    """Update user's emotional and behavioral state."""
    archetype_data = user_profile["archetype_data"]

    # Update mood
    user_profile["current_mood"] = random.choice(EMOTIONS)
    user_profile["mood_trend"].append(user_profile["current_mood"])
    if len(user_profile["mood_trend"]) > 7:  # Keep only last week of moods
        user_profile["mood_trend"] = user_profile["mood_trend"][-7:]

    mood_sensitivity = archetype_data.get("mood_sensitivity", 0.2)
    drift_tendency = archetype_data.get("drift_tendency", 0.1)
    engagement_decay = archetype_data.get("engagement_decay", 0.05)

    # Update resistance and drift based on mood
    if user_profile["current_mood"] in ["sadness", "anger", "anxiety", "frustration", "drained", "despair"]:
        user_profile["resistance_score"] = min(1, user_profile["resistance_score"] + mood_sensitivity * 0.15)
        user_profile["drift"] = min(1, user_profile["drift"] + drift_tendency * 0.15)
    elif user_profile["current_mood"] in ["happiness", "joy", "excitement", "calmness", "contentment"]:
        user_profile["resistance_score"] = max(0, user_profile["resistance_score"] - mood_sensitivity * 0.05)
        user_profile["drift"] = max(0, user_profile["drift"] - drift_tendency * 0.05)
    else:
        user_profile["resistance_score"] = max(0, user_profile["resistance_score"] + (random.uniform(-0.02, 0.02)))
        user_profile["drift"] = max(0, user_profile["drift"] + (random.uniform(-0.01, 0.01)))

    # Handle timezone-aware datetime comparison
    if isinstance(user_profile["last_interaction_day"], str):
        user_profile["last_interaction_day"] = datetime.fromisoformat(user_profile["last_interaction_day"]).astimezone(pytz.utc)
    elif user_profile["last_interaction_day"].tzinfo is None:
        user_profile["last_interaction_day"] = pytz.utc.localize(user_profile["last_interaction_day"])

    days_since_last_interaction = (time_anchor_day.astimezone(pytz.utc) - user_profile["last_interaction_day"].astimezone(pytz.utc)).days

    # Update engagement based on interaction frequency
    if days_since_last_interaction > 1:
        user_profile["engagement_score"] = max(0, user_profile["engagement_score"] - engagement_decay * days_since_last_interaction)

    # Ensure scores stay within bounds
    user_profile["resistance_score"] = max(0, min(1, user_profile["resistance_score"]))
    user_profile["drift"] = max(0, min(1, user_profile["drift"]))
    user_profile["engagement_score"] = max(0, min(1, user_profile["engagement_score"]))
    
    # Update goal drift score based on progress
    if simulated_goal_progress["score"] < 0.3:
        user_profile["goal_drift_score"] = min(1, user_profile["goal_drift_score"] + 0.1)
    else:
        user_profile["goal_drift_score"] = max(0, user_profile["goal_drift_score"] - 0.05)

def simulate_goal_progress(user_profile: Dict) -> Dict:
    """Simulate daily goal progress based on user state."""
    progress = random.uniform(0.05, 0.2)

    # Mood impact
    if user_profile["current_mood"] in ["happiness", "joy", "excitement", "empowerment"]:
        progress += 0.1
    elif user_profile["current_mood"] in ["sadness", "frustration", "drained", "despair"]:
        progress -= 0.05

    # State impact
    progress -= user_profile["resistance_score"] * 0.1
    progress += user_profile["engagement_score"] * 0.05
    progress -= user_profile["drift"] * 0.08

    # Archetype-specific modifiers
    if user_profile["archetype"] == "Self-Improvement Junkie" and random.random() < 0.3:
        progress += 0.1  # Occasional bursts of progress
    elif user_profile["archetype"] == "Distracted Dreamer" and random.random() < 0.4:
        progress -= 0.05  # Tendency to lose focus

    return {
        "score": max(0, min(1, progress)),
        "days_off_track": 0 if progress > 0.1 else random.randint(1, 3)
    }

def generate_scenario_data(user_profile: Dict, time_base: datetime, simulated_goal_progress: Dict, scenario_type: str) -> Dict:
    """Generate detailed scenario data for an interaction."""
    current_time = time_base + timedelta(minutes=random.randint(1, 1440))
    iso_time = current_time.isoformat()
    time_category = categorize_time_of_day(current_time)
    
    # Determine app based on user state and archetype
    app_category = determine_app_category(user_profile, time_category)
    app_name = random.choice(APP_CATEGORIES[app_category])
    
    # Context generation
    location_type = determine_location(time_category, app_category)
    was_with_others = random.choice([True, False])
    weather = random.choice(["sunny", "cloudy", "rainy", "snowy", "windy", "foggy"])
    
    # Content and emotional data
    content_type = random.choice(CONTENT_TYPES)
    recent_text_emotion = user_profile["current_mood"] if random.random() < 0.7 else random.choice(EMOTIONS)
    recent_text_input = random.choice(recent_text_templates.get(recent_text_emotion, recent_text_templates["neutral"]))
    
    # Usage patterns
    duration_minutes = determine_duration(app_category, user_profile, time_category)
    frequency_per_day = random.randint(1, 10)
    
    # Risk assessment
    is_misaligned = assess_goal_alignment(app_category, user_profile, time_category)
    manipulation_tech = None
    emotion_detected = recent_text_emotion
    emotion_intensity = determine_emotion_intensity(emotion_detected, is_misaligned)
    psychological_risk = False
    
    # Physical world context
    physical_world_context = generate_physical_world_context(location_type, was_with_others, user_profile)
    
    # Manipulation and risk detection
    if is_misaligned and random.random() < 0.6:
        manipulation_tech = random.choice(MANIPULATION_TECHNIQUES)
        psychological_risk = True
    
    if time_category == "late_night" and app_category in ["Social Media", "Entertainment", "Adult"]:
        if random.random() < 0.7:
            is_misaligned = True
            psychological_risk = True
            emotion_detected = random.choice(["drained", "regret", "anxiety"])
            emotion_intensity = "intense"
    
    # Financial risk detection
    financial_burden_risk = False
    if app_category == "Shopping" and user_profile["goal_drift_score"] > 0.3:
        if random.random() < 0.5:
            financial_burden_risk = True
            is_misaligned = True
    
    # Apply manipulation templates
    if manipulation_tech and manipulation_tech in MANIPULATION_COPY_TEMPLATES:
        content_text = apply_manipulation_template(manipulation_tech, recent_text_input)
    else:
        content_text = recent_text_input
    
    # Behavior type determination
    behavior_type = get_behavior_type({
        "app_data": {"app_category": app_category, "duration_minutes": duration_minutes},
        "is_misaligned_with_goals": is_misaligned,
        "manipulation_technique_present": manipulation_tech,
        "time_data": {"time_of_day_category": time_category},
        "multimodal_data": {"recent_text_input_emotion": recent_text_emotion}
    }, user_profile)
    
    base_data = {
        "app_data": {
            "app_name": app_name,
            "app_category": app_category,
            "duration_minutes": duration_minutes,
            "frequency_per_day": frequency_per_day
        },
        "time_data": {
            "iso_time": iso_time,
            "time_of_day_category": time_category,
            "focus_state": get_focus_state(time_category, app_category)
        },
        "multimodal_data": {
            "speech_sentiment": emotion_detected,
            "vocal_tone": random.choice(VOCAL_TONES),
            "content_text": content_text,
            "content_type": content_type,
            "recent_text_input": recent_text_input,
            "recent_text_input_emotion": recent_text_emotion
        },
        "context_data": {
            "location_type": location_type,
            "was_with_others": was_with_others,
            "weather": weather
        },
        "goal_data": {
            "goal_progress_score": simulated_goal_progress["score"],
            "days_off_track": simulated_goal_progress["days_off_track"],
            "missed_habits": random.sample(COMMON_HABITS, min(len(COMMON_HABITS), random.randint(0, 2)))
        },
        "is_misaligned_with_goals": is_misaligned,
        "manipulation_technique_present": manipulation_tech,
        "psychological_risk": psychological_risk,
        "emotion_detected": emotion_detected,
        "emotion_intensity": emotion_intensity,
        "financial_burden_risk": financial_burden_risk,
        "physical_world_context": physical_world_context,
        "detected_drift_trigger": random.choice(PSYCHOLOGICAL_TRIGGERS) if is_misaligned else None,
        "behavior_type": behavior_type
    }
    
    if scenario_type == "notification":
        base_data["notification_id"] = fake.uuid4()
        base_data["content"] = fake.sentence(nb_words=random.randint(5, 15))
    else:
        base_data["session_id"] = fake.uuid4()
    
    return base_data

def determine_app_category(user_profile: Dict, time_category: str) -> str:
    """Determine app category based on user profile and time."""
    archetype_name = user_profile["archetype"]
    current_mood = user_profile["current_mood"]
    goal_drift_score = user_profile["goal_drift_score"]
    
    # Archetype-specific preferences
    archetype_preferences = {
        "Burnt-out Overachiever": ["Productivity", "News", "Wellness"],
        "Lonely Scroller": ["Social Media", "Communication", "Entertainment"],
        "Doomscroll Addict": ["News", "Social Media"],
        "Spiritual Seeker": ["Spiritual", "Wellness", "Learning"],
        "Validation Hunter": ["Social Media", "Shopping"],
        "Self-Improvement Junkie": ["Learning", "Wellness", "Productivity"],
        "Distracted Dreamer": ["Entertainment", "Creative Tools", "Social Media"],
        "Emotional Escape Artist": ["Entertainment", "Adult", "Gaming"],
        "Social Connector": ["Communication", "Social Media"],
        "Information Hoarder": ["News", "Learning", "Productivity"]
    }
    
    # Mood-based modifiers
    mood_modifiers = {
        "sadness": ["Entertainment", "Social Media"],
        "anxiety": ["News", "Wellness"],
        "boredom": ["Entertainment", "Shopping", "Social Media"],
        "loneliness": ["Social Media", "Communication", "Adult"],
        "stress": ["Entertainment", "Wellness", "Adult"],
        "happiness": ["Social Media", "Communication", "Creative Tools"]
    }
    
    # Time-based patterns
    time_patterns = {
        "morning": ["News", "Productivity", "Wellness"],
        "afternoon": ["Productivity", "Communication", "Learning"],
        "evening": ["Entertainment", "Social Media", "Communication"],
        "late_night": ["Entertainment", "Social Media", "Adult"]
    }
    
    # Combine preferences
    categories = list(APP_CATEGORIES.keys())
    weights = [1.0] * len(categories)
    
    # Apply archetype preferences
    if archetype_name in archetype_preferences:
        for cat in archetype_preferences[archetype_name]:
            if cat in categories:
                weights[categories.index(cat)] *= 2.0
    
    # Apply mood modifiers
    if current_mood in mood_modifiers:
        for cat in mood_modifiers[current_mood]:
            if cat in categories:
                weights[categories.index(cat)] *= 1.5
    
    # Apply time patterns
    if time_category in time_patterns:
        for cat in time_patterns[time_category]:
            if cat in categories:
                weights[categories.index(cat)] *= 1.3
    
    # Apply drift influence
    if goal_drift_score > 0.5:
        problematic_categories = ["Social Media", "Entertainment", "Shopping", "Adult", "News"]
        for cat in problematic_categories:
            if cat in categories:
                weights[categories.index(cat)] *= 1.5
    
    return random.choices(categories, weights=weights, k=1)[0]

def determine_location(time_category: str, app_category: str) -> str:
    """Determine likely location based on time and app usage."""
    location_probabilities = {
        "morning": {
            "home": 0.5, "commute": 0.2, "work": 0.15, "cafe": 0.1, "gym": 0.05
        },
        "afternoon": {
            "work": 0.4, "home": 0.2, "cafe": 0.1, "outside": 0.1, "shopping_mall": 0.1, "restaurant": 0.1
        },
        "evening": {
            "home": 0.6, "commute": 0.1, "restaurant": 0.1, "friend's_house": 0.1, "gym": 0.05, "bar": 0.05
        },
        "late_night": {
            "home": 0.7, "bedroom": 0.2, "bar": 0.05, "friend's_house": 0.05
        }
    }
    
    # Adjust for app category
    if app_category == "Productivity":
        return random.choices(["work", "home", "cafe", "library"], weights=[0.4, 0.3, 0.2, 0.1], k=1)[0]
    elif app_category == "Adult":
        return random.choices(["bedroom", "bathroom", "home"], weights=[0.5, 0.2, 0.3], k=1)[0]
    elif app_category == "Fitness":
        return random.choices(["gym", "outside", "home"], weights=[0.5, 0.3, 0.2], k=1)[0]
    
    # Default to time-based location
    locations = list(location_probabilities.get(time_category, {"home": 1.0}).keys())
    weights = list(location_probabilities.get(time_category, {"home": 1.0}).values())
    return random.choices(locations, weights=weights, k=1)[0]

def determine_duration(app_category: str, user_profile: Dict, time_category: str) -> int:
    """Determine session duration based on various factors."""
    base_durations = {
        "Social Media": (5, 60),
        "Productivity": (15, 90),
        "Entertainment": (10, 180),
        "News": (5, 45),
        "Shopping": (5, 60),
        "Wellness": (10, 45),
        "Communication": (5, 30),
        "Adult": (10, 120),
        "Learning": (15, 60),
        "Finance": (5, 20),
        "Spiritual": (10, 30),
        "Navigation/Travel": (2, 15),
        "Creative Tools": (15, 120),
        "Utilities/Tools": (1, 5)
    }
    
    min_duration, max_duration = base_durations.get(app_category, (5, 30))
    
    # Modify based on user state
    if user_profile["drift"] > 0.5:
        max_duration = int(max_duration * 1.5)
    
    if time_category == "late_night":
        max_duration = int(max_duration * 1.3)
    
    if user_profile["current_mood"] in ["boredom", "loneliness", "sadness"]:
        max_duration = int(max_duration * 1.2)
    
    return random.randint(min_duration, max_duration)

def assess_goal_alignment(app_category: str, user_profile: Dict, time_category: str) -> bool:
    """Assess whether current behavior aligns with user goals."""
    misalignment_probability = 0.0
    
    # Check direct goal conflicts
    if "Productivity" in user_profile["life_goals"] and app_category in ["Entertainment", "Social Media"]:
        misalignment_probability += 0.3
    
    if "Health" in user_profile["life_goals"] and time_category == "late_night":
        misalignment_probability += 0.4
    
    if "Financial Stability" in user_profile["life_goals"] and app_category == "Shopping":
        misalignment_probability += 0.5
    
    if "Peace" in user_profile["life_goals"] and app_category == "News":
        misalignment_probability += 0.3
    
    if "Connection" in user_profile["life_goals"] and app_category == "Adult":
        misalignment_probability += 0.2
    
    # Modify based on user state
    misalignment_probability += user_profile["drift"] * 0.2
    misalignment_probability += (1 - user_profile["engagement_score"]) * 0.1
    
    return random.random() < misalignment_probability

def determine_emotion_intensity(emotion: str, is_misaligned: bool) -> str:
    """Determine emotion intensity based on context."""
    if is_misaligned:
        if emotion in ["anger", "frustration", "anxiety", "regret", "shame"]:
            return random.choices(["moderate", "intense", "overwhelming"], weights=[0.3, 0.5, 0.2], k=1)[0]
        else:
            return random.choices(["mild", "moderate", "intense"], weights=[0.2, 0.5, 0.3], k=1)[0]
    else:
        return random.choices(["mild", "moderate", "subtle"], weights=[0.4, 0.4, 0.2], k=1)[0]

def generate_physical_world_context(location_type: str, was_with_others: bool, user_profile: Dict) -> Dict:
    """Generate physical world context and opportunities."""
    context = {
        "inferred_activity": None,
        "relevant_physical_habit_opportunity": None,
        "relevant_physical_risk_detected": None
    }
    
    if location_type == "bar" and random.random() < 0.6:
        context["inferred_activity"] = "socializing at a bar"
        context["relevant_physical_risk_detected"] = "excessive bar time"
    
    elif location_type == "grocery store" and "Improve physical health" in user_profile["physical_world_goals"]:
        context["inferred_activity"] = "grocery shopping"
        context["relevant_physical_habit_opportunity"] = "buy healthier foods"
    
    elif location_type == "home" and not was_with_others:
        if "Strengthen family ties" in user_profile["physical_world_goals"] and random.random() < 0.3:
            context["inferred_activity"] = "at home alone"
            context["relevant_physical_habit_opportunity"] = "call family member"
        elif "Increase social engagement" in user_profile["physical_world_goals"] and random.random() < 0.3:
            context["inferred_activity"] = "at home alone"
            context["relevant_physical_habit_opportunity"] = "meet a friend in person"
    
    elif location_type in ["bedroom", "in bed"] and random.random() < 0.5:
        context["inferred_activity"] = "using phone in bed"
        context["relevant_physical_risk_detected"] = "excessive screen time in bed"
    
    elif location_type == "outside":
        context["inferred_activity"] = "outdoors"
        if "Pursue outdoor hobbies" in user_profile["physical_world_goals"]:
            context["relevant_physical_habit_opportunity"] = "engage in outdoor activity"
    
    return context

def apply_manipulation_template(technique: str, base_content: str) -> str:
    """Apply manipulation template to content."""
    if technique not in MANIPULATION_COPY_TEMPLATES:
        return base_content
    
    template = random.choice(MANIPULATION_COPY_TEMPLATES[technique])
    
    try:
        # Provide all possible template variables
        return template.format(
            content=base_content,
            topic=fake.word(),
            product=fake.word(),
            cause=fake.bs(),
            group=fake.word(),
            sensitive_topic=fake.word(),
            event=fake.catch_phrase(),
            company=fake.company(),
            first_name=fake.first_name()
        )
    except Exception as e:
        print(f"Warning: Error applying manipulation template '{technique}': {e}")
        return base_content

def aggregate_weekly_behavior(daily_interactions_list: List[Dict], user_profile: Dict) -> Dict:
    """Aggregate daily interactions into weekly behavioral summary."""
    if not daily_interactions_list:
        return create_empty_weekly_summary()
    
    weekly_data = {
        "week_start_date": daily_interactions_list[0]["time_data"]["iso_time"].split('T')[0],
        "total_behavioral_events": len(daily_interactions_list),
        "app_sessions_summary": {},
        "notifications_summary": {"total_received": 0, "total_resisted": 0, "problematic_count": 0},
        "drift_events_details": [],
        "aligned_events_details": [],
        "trigger_patterns_observed": {},
        "goal_alignment_timeline": {},
        "emotional_arc_summary": "",
        "strength_signals": [],
        "vulnerability_time_zones": {},
        "physical_world_risks_observed": [],
        "physical_world_opportunities_observed": [],
        "behavioral_patterns": {
            "most_used_apps": {},
            "peak_usage_times": {},
            "weekend_vs_weekday": {"weekend": 0, "weekday": 0}
        }
    }
    
    daily_moods = []
    daily_alignments = []
    
    for interaction in daily_interactions_list:
        # Process app usage
        app_name = interaction["app_data"]["app_name"]
        app_category = interaction["app_data"]["app_category"]
        duration = interaction["app_data"]["duration_minutes"]
        time_category = interaction["time_data"]["time_of_day_category"]
        iso_time = interaction["time_data"]["iso_time"]
        
        # Aggregate app sessions
        if app_name not in weekly_data["app_sessions_summary"]:
            weekly_data["app_sessions_summary"][app_name] = {
                "count": 0,
                "total_duration": 0,
                "late_night_count": 0,
                "category": app_category,
                "average_duration": 0
            }
        
        weekly_data["app_sessions_summary"][app_name]["count"] += 1
        weekly_data["app_sessions_summary"][app_name]["total_duration"] += duration
        if time_category == "late_night":
            weekly_data["app_sessions_summary"][app_name]["late_night_count"] += 1
        
        # Track behavioral patterns
        weekly_data["behavioral_patterns"]["most_used_apps"][app_name] = \
            weekly_data["behavioral_patterns"]["most_used_apps"].get(app_name, 0) + 1
        
        weekly_data["behavioral_patterns"]["peak_usage_times"][time_category] = \
            weekly_data["behavioral_patterns"]["peak_usage_times"].get(time_category, 0) + 1
        
        # Weekend vs weekday
        interaction_date = datetime.fromisoformat(iso_time.split('T')[0])
        if interaction_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            weekly_data["behavioral_patterns"]["weekend_vs_weekday"]["weekend"] += 1
        else:
            weekly_data["behavioral_patterns"]["weekend_vs_weekday"]["weekday"] += 1
        
        # Process notifications
        if "notification_id" in interaction:
            weekly_data["notifications_summary"]["total_received"] += 1
            if interaction["time_data"]["focus_state"] == "high" and not interaction["is_misaligned_with_goals"]:
                if random.random() < 0.7:
                    weekly_data["notifications_summary"]["total_resisted"] += 1
                    weekly_data["strength_signals"].append(f"Resisted notification from {app_name} during focused work")
            
            if interaction.get("manipulation_technique_present"):
                weekly_data["notifications_summary"]["problematic_count"] += 1
        
        # Track drift and alignment
        if interaction["is_misaligned_with_goals"]:
            drift_desc = generate_drift_description(interaction, user_profile)
            weekly_data["drift_events_details"].append(drift_desc)
            daily_alignments.append("misaligned")
        else:
            aligned_desc = generate_aligned_description(interaction, user_profile)
            weekly_data["aligned_events_details"].append(aligned_desc)
            daily_alignments.append("aligned")
            
            # Look for strength signals
            if interaction["app_data"]["app_category"] == "Wellness":
                weekly_data["strength_signals"].append(f"Engaged with {app_name} for self-care")
            elif interaction["app_data"]["app_category"] == "Learning":
                weekly_data["strength_signals"].append(f"Invested {duration} minutes in learning via {app_name}")
        
        # Track triggers
        if interaction.get("manipulation_technique_present"):
            trigger = interaction["manipulation_technique_present"]
            weekly_data["trigger_patterns_observed"][trigger] = \
                weekly_data["trigger_patterns_observed"].get(trigger, 0) + 1
        elif interaction.get("detected_drift_trigger"):
            trigger = interaction["detected_drift_trigger"]
            weekly_data["trigger_patterns_observed"][trigger] = \
                weekly_data["trigger_patterns_observed"].get(trigger, 0) + 1
        
        # Track vulnerability zones
        weekly_data["vulnerability_time_zones"][time_category] = \
            weekly_data["vulnerability_time_zones"].get(time_category, 0) + 1
        
        # Collect daily moods
        daily_moods.append(interaction["emotion_detected"])
        
        # Track physical world context
        pwc = interaction.get("physical_world_context", {})
        if pwc.get("relevant_physical_risk_detected"):
            weekly_data["physical_world_risks_observed"].append(pwc["relevant_physical_risk_detected"])
        if pwc.get("relevant_physical_habit_opportunity"):
            weekly_data["physical_world_opportunities_observed"].append(pwc["relevant_physical_habit_opportunity"])
        
        # Goal alignment timeline
        day_date = iso_time.split('T')[0]
        if day_date not in weekly_data["goal_alignment_timeline"]:
            weekly_data["goal_alignment_timeline"][day_date] = {"aligned": 0, "misaligned": 0}
        
        if interaction["is_misaligned_with_goals"]:
            weekly_data["goal_alignment_timeline"][day_date]["misaligned"] += 1
        else:
            weekly_data["goal_alignment_timeline"][day_date]["aligned"] += 1
    
    # Calculate averages for app usage
    for app_data in weekly_data["app_sessions_summary"].values():
        if app_data["count"] > 0:
            app_data["average_duration"] = round(app_data["total_duration"] / app_data["count"], 1)
    
    # Generate emotional arc summary
    weekly_data["emotional_arc_summary"] = generate_emotional_arc_summary(daily_moods)
    
    # Identify key patterns
    weekly_data["key_patterns"] = identify_key_patterns(weekly_data, user_profile)
    
    return weekly_data

def generate_drift_description(interaction: Dict, user_profile: Dict) -> str:
    """Generate descriptive text for drift events."""
    app_name = interaction["app_data"]["app_name"]
    app_category = interaction["app_data"]["app_category"]
    duration = interaction["app_data"]["duration_minutes"]
    time_category = interaction["time_data"]["time_of_day_category"]
    emotion = interaction["emotion_detected"]
    intensity = interaction["emotion_intensity"]
    
    # Select relevant goal being compromised
    compromised_goal = random.choice(user_profile["life_goals"])
    
    descriptions = [
        f"{time_category.replace('_', ' ').title()} {app_category} session on {app_name} ({duration} mins) pulled away from {compromised_goal}. Feeling: {emotion} ({intensity}).",
        f"Lost {duration} minutes to {app_name} when intending to focus on {compromised_goal}. Emotional state: {emotion}.",
        f"Drift event: {app_name} captured attention for {duration} mins during {time_category}. Goal of {compromised_goal} temporarily abandoned."
    ]
    
    desc = random.choice(descriptions)
    
    if interaction.get("manipulation_technique_present"):
        desc += f" Triggered by: {interaction['manipulation_technique_present']}."
    
    return desc

def generate_aligned_description(interaction: Dict, user_profile: Dict) -> str:
    """Generate descriptive text for aligned behavior."""
    app_name = interaction["app_data"]["app_name"]
    app_category = interaction["app_data"]["app_category"]
    duration = interaction["app_data"]["duration_minutes"]
    emotion = interaction["emotion_detected"]
    
    # Select relevant goal being supported
    supported_goal = random.choice(user_profile["life_goals"])
    
    descriptions = [
        f"Productive {duration}-minute session on {app_name} supporting {supported_goal}. Mood: {emotion}.",
        f"Aligned behavior: Used {app_name} ({app_category}) intentionally for {duration} mins, advancing {supported_goal}.",
        f"Goal-supporting activity: {app_name} session enhanced progress toward {supported_goal}."
    ]
    
    return random.choice(descriptions)

def generate_emotional_arc_summary(daily_moods: List[str]) -> str:
    """Generate summary of emotional journey through the week."""
    if not daily_moods:
        return "No emotional data available."
    
    start_mood = daily_moods[0]
    end_mood = daily_moods[-1]
    
    # Count mood categories
    positive_moods = ["happiness", "joy", "excitement", "contentment", "hope", "gratitude", "empowerment"]
    negative_moods = ["sadness", "anger", "anxiety", "frustration", "regret", "loneliness", "shame"]
    
    positive_count = sum(1 for mood in daily_moods if mood in positive_moods)
    negative_count = sum(1 for mood in daily_moods if mood in negative_moods)
    
    # Identify mood shifts
    significant_shifts = []
    for i in range(len(daily_moods) - 1):
        if (daily_moods[i] in positive_moods and daily_moods[i+1] in negative_moods) or \
           (daily_moods[i] in negative_moods and daily_moods[i+1] in positive_moods):
            significant_shifts.append(f"{daily_moods[i]} → {daily_moods[i+1]}")
    
    # Build summary
    if positive_count > negative_count * 1.5:
        tone = "predominantly positive"
    elif negative_count > positive_count * 1.5:
        tone = "challenging"
    else:
        tone = "mixed"
    
    summary = f"A {tone} week: started feeling {start_mood}"
    
    if significant_shifts:
        summary += f", experienced shifts including {', '.join(significant_shifts[:2])}"
    
    summary += f", ended feeling {end_mood}."
    
    return summary

def identify_key_patterns(weekly_data: Dict, user_profile: Dict) -> List[str]:
    """Identify key behavioral patterns from weekly data."""
    patterns = []
    
    # Most vulnerable time
    if weekly_data["vulnerability_time_zones"]:
        worst_time = max(weekly_data["vulnerability_time_zones"], key=weekly_data["vulnerability_time_zones"].get)
        patterns.append(f"Most vulnerable during {worst_time} hours")
    
    # App usage patterns
    total_duration = sum(app["total_duration"] for app in weekly_data["app_sessions_summary"].values())
    if total_duration > 0:
        most_used_app = max(weekly_data["app_sessions_summary"].items(), 
                           key=lambda x: x[1]["total_duration"])
        percentage = (most_used_app[1]["total_duration"] / total_duration) * 100
        patterns.append(f"{most_used_app[0]} dominated screen time ({percentage:.0f}% of total)")
    
    # Drift vs alignment ratio
    drift_count = len(weekly_data["drift_events_details"])
    aligned_count = len(weekly_data["aligned_events_details"])
    if drift_count + aligned_count > 0:
        drift_ratio = drift_count / (drift_count + aligned_count)
        if drift_ratio > 0.6:
            patterns.append("High drift tendency observed")
        elif drift_ratio < 0.3:
            patterns.append("Strong goal alignment maintained")
    
    # Notification resistance
    if weekly_data["notifications_summary"]["total_received"] > 0:
        resistance_rate = weekly_data["notifications_summary"]["total_resisted"] / \
                         weekly_data["notifications_summary"]["total_received"]
        if resistance_rate > 0.6:
            patterns.append(f"High notification resistance ({resistance_rate:.0%})")
    
    return patterns

def build_guardian_weekly_summary_prompt(user_profile: Dict, weekly_summary_data: Dict) -> Tuple[str, str]:
    """Build optimized prompt for Guardian weekly summary."""
    prompt_parts = []
    
    # Add exemplar
    prompt_parts.append("## EXEMPLAR GUARDIAN WEEKLY SUMMARY ##")
    prompt_parts.append(
        "**Guardian Weekly Report: 2025-07-15 - 2025-07-21**\n\n"
        "Sarah, I've been watching over your digital journey this week with both admiration and concern.\n\n"
        "You invested over 300 minutes in learning platforms—a testament to your Self-Improvement Junkie "
        "nature—but I also witnessed 12 late-night sessions that left you feeling drained and regretful. "
        "Your emotional arc tells a story: starting with hope on Monday, cycling through anxiety mid-week, "
        "and ending in exhaustion by Sunday.\n\n"
        "What stood out: You resisted 8 out of 15 manipulative notifications, including three "
        "'FOMO' triggers from shopping apps. That's real strength. But TikTok's algorithm caught you "
        "in comparison loops five times, each lasting 45+ minutes.\n\n"
        "Your 'Productivity' goal took hits during evening hours when you'd drift to entertainment "
        "instead of winding down mindfully. Yet you showed remarkable discipline during morning hours, "
        "with Notion sessions averaging 67 minutes of focused work.\n\n"
        "Guardian's insight: Your pattern shows a recurring cycle—productive mornings, anxious afternoons, "
        "escapist evenings. The drift isn't about laziness; it's about unprocessed emotions seeking outlets.\n\n"
        "This week, I invite you to try one thing: When you feel the evening drift beginning, pause and name "
        "what you're actually feeling. Just naming it reduces its power by 40% (yes, I track these things).\n\n"
        "Remember: Progress isn't perfection. It's awareness meeting action, one moment at a time."
    )
    
    # Determine tone based on weekly patterns
    drift_events = len(weekly_summary_data["drift_events_details"])
    aligned_events = len(weekly_summary_data["aligned_events_details"])
    
    if drift_events > aligned_events:
        tone_label = random.choice(["compassionate_confrontation", "firm_but_fair", "direct_accountability"])
    elif aligned_events > drift_events * 2:
        tone_label = random.choice(["celebratory_affirmation", "motivational_surge", "gentle_guidance"])
    else:
        tone_label = random.choice(["insightful_questioning", "empathetic_listening", "spiritual_reflection"])
    
    # Guardian identity (condensed)
    prompt_parts.append(f"\n## GUARDIAN IDENTITY ##")
    prompt_parts.append(f"You are Guardian, a wise digital wellness AI. Current tone: {tone_label}")
    prompt_parts.append(f"Voice style: {GUARDIAN_IDENTITY['voice_style'].get(tone_label, GUARDIAN_IDENTITY['voice_style']['default'])}")
    
    # User context (condensed)
    prompt_parts.append(f"\n## USER CONTEXT ##")
    prompt_parts.append(f"Name: {user_profile['name']}")
    prompt_parts.append(f"Archetype: {user_profile['archetype']} - {ARCHETYPE_PROMPT_STYLES.get(user_profile['archetype'], '')}")
    prompt_parts.append(f"Current state: Mood={user_profile['current_mood']}, Resistance={user_profile['resistance_score']:.1f}, Engagement={user_profile['engagement_score']:.1f}")
    prompt_parts.append(f"Life goals: {', '.join(user_profile['life_goals'][:3])}")
    
    # Weekly behavioral data (condensed)
    prompt_parts.append(f"\n## WEEKLY BEHAVIORAL SUMMARY ##")
    prompt_parts.append(f"Period: {weekly_summary_data['week_start_date']} (7 days)")
    prompt_parts.append(f"Total events tracked: {weekly_summary_data['total_behavioral_events']}")
    
    # Key apps and usage
    if weekly_summary_data["app_sessions_summary"]:
        top_apps = sorted(weekly_summary_data["app_sessions_summary"].items(), 
                         key=lambda x: x[1]["total_duration"], reverse=True)[:3]
        prompt_parts.append("\nTop app usage:")
        for app, data in top_apps:
            prompt_parts.append(f"- {app}: {data['total_duration']} mins across {data['count']} sessions")
            if data['late_night_count'] > 0:
                prompt_parts.append(f"  (including {data['late_night_count']} late-night sessions)")
    
    # Drift vs alignment
    prompt_parts.append(f"\nBehavioral alignment:")
    prompt_parts.append(f"- Drift events: {len(weekly_summary_data['drift_events_details'])}")
    prompt_parts.append(f"- Aligned events: {len(weekly_summary_data['aligned_events_details'])}")
    
    # Sample events (limited)
    if weekly_summary_data["drift_events_details"]:
        prompt_parts.append("\nKey drift moments:")
        for event in weekly_summary_data["drift_events_details"][:2]:
            prompt_parts.append(f"- {event}")
    
    if weekly_summary_data["strength_signals"]:
        prompt_parts.append("\nStrength signals:")
        for signal in weekly_summary_data["strength_signals"][:2]:
            prompt_parts.append(f"- {signal}")
    
    # Emotional journey
    prompt_parts.append(f"\nEmotional arc: {weekly_summary_data['emotional_arc_summary']}")
    
    # Key patterns
    if weekly_summary_data.get("key_patterns"):
        prompt_parts.append("\nKey patterns:")
        for pattern in weekly_summary_data["key_patterns"][:3]:
            prompt_parts.append(f"- {pattern}")
    
    # Manipulation/triggers
    if weekly_summary_data["trigger_patterns_observed"]:
        top_trigger = max(weekly_summary_data["trigger_patterns_observed"].items(), 
                         key=lambda x: x[1])
        prompt_parts.append(f"\nMost frequent trigger: {top_trigger[0]} ({top_trigger[1]} times)")
    
    # Instructions
    prompt_parts.append("\n## GUARDIAN INSTRUCTIONS ##")
    prompt_parts.append(
        "Create a warm, insightful weekly summary that:\n"
        "1. Opens with empathetic acknowledgment of the user's week\n"
        "2. Highlights 2-3 specific behavioral patterns (both positive and concerning)\n"
        "3. Connects behaviors to emotional states and goals\n"
        "4. Offers ONE clear, actionable insight or gentle challenge\n"
        "5. Ends with an encouraging reflection or question\n\n"
        "Use specific data points naturally. Avoid lists or clinical language. "
        "Write as if you've been quietly watching over them with care. "
        "Keep it under 300 words.\n\n"
        "Start with: **Guardian Weekly Report: [dates]**"
    )
    
    # Join and optimize
    full_prompt = "\n".join(prompt_parts)
    
    # Trim if needed
    if len(full_prompt) > 8000:
        full_prompt = trim_prompt_sections(prompt_parts, max_chars=8000)
        full_prompt = "\n".join(full_prompt)
    
    return full_prompt, tone_label
prompt_parts.append(f"Voice style: {GUARDIAN_IDENTITY['voice_style'].get(tone_label, GUARDIAN_IDENTITY['voice_style']['default'])}")
    
    # User context (condensed)
    prompt_parts.append(f"\n## USER CONTEXT ##")
    prompt_parts.append(f"Name: {user_profile['name']}")
    prompt_parts.append(f"Archetype: {user_profile['archetype']} - {ARCHETYPE_PROMPT_STYLES.get(user_profile['archetype'], '')}")
    prompt_parts.append(f"Current state: Mood={user_profile['current_mood']}, Resistance={user_profile['resistance_score']:.1f}, Engagement={user_profile['engagement_score']:.1f}")
    prompt_parts.append(f"Life goals: {', '.join(user_profile['life_goals'][:3])}")
    
    # Weekly behavioral data (condensed)
    prompt_parts.append(f"\n## WEEKLY BEHAVIORAL SUMMARY ##")
    prompt_parts.append(f"Period: {weekly_summary_data['week_start_date']} (7 days)")
    prompt_parts.append(f"Total events tracked: {weekly_summary_data['total_behavioral_events']}")
    
    # Key apps and usage
    if weekly_summary_data["app_sessions_summary"]:
        top_apps = sorted(weekly_summary_data["app_sessions_summary"].items(), 
                         key=lambda x: x[1]["total_duration"], reverse=True)[:3]
        prompt_parts.append("\nTop app usage:")
        for app, data in top_apps:
            prompt_parts.append(f"- {app}: {data['total_duration']} mins across {data['count']} sessions")
            if data['late_night_count'] > 0:
                prompt_parts.append(f"  (including {data['late_night_count']} late-night sessions)")
    
    # Drift vs alignment
    prompt_parts.append(f"\nBehavioral alignment:")
    prompt_parts.append(f"- Drift events: {len(weekly_summary_data['drift_events_details'])}")
    prompt_parts.append(f"- Aligned events: {len(weekly_summary_data['aligned_events_details'])}")
    
    # Sample events (limited)
    if weekly_summary_data["drift_events_details"]:
        prompt_parts.append("\nKey drift moments:")
        for event in weekly_summary_data["drift_events_details"][:2]:
            prompt_parts.append(f"- {event}")
    
    if weekly_summary_data["strength_signals"]:
        prompt_parts.append("\nStrength signals:")
        for signal in weekly_summary_data["strength_signals"][:2]:
            prompt_parts.append(f"- {signal}")
    
    # Emotional journey
    prompt_parts.append(f"\nEmotional arc: {weekly_summary_data['emotional_arc_summary']}")
    
    # Key patterns
    if weekly_summary_data.get("key_patterns"):
        prompt_parts.append("\nKey patterns:")
        for pattern in weekly_summary_data["key_patterns"][:3]:
            prompt_parts.append(f"- {pattern}")
    
    # Manipulation/triggers
    if weekly_summary_data["trigger_patterns_observed"]:
        top_trigger = max(weekly_summary_data["trigger_patterns_observed"].items(), 
                         key=lambda x: x[1])
        prompt_parts.append(f"\nMost frequent trigger: {top_trigger[0]} ({top_trigger[1]} times)")
    
    # Instructions
    prompt_parts.append("\n## GUARDIAN INSTRUCTIONS ##")
    prompt_parts.append(
        "Create a warm, insightful weekly summary that:\n"
        "1. Opens with empathetic acknowledgment of the user's week\n"
        "2. Highlights 2-3 specific behavioral patterns (both positive and concerning)\n"
        "3. Connects behaviors to emotional states and goals\n"
        "4. Offers ONE clear, actionable insight or gentle challenge\n"
        "5. Ends with an encouraging reflection or question\n\n"
        "Use specific data points naturally. Avoid lists or clinical language. "
        "Write as if you've been quietly watching over them with care. "
        "Keep it under 300 words.\n\n"
        "Start with: **Guardian Weekly Report: [dates]**"
    )
    
    # Join and optimize
    full_prompt = "\n".join(prompt_parts)
    
    # Trim if needed
    if len(full_prompt) > 8000:
        full_prompt = trim_prompt_sections(prompt_parts, max_chars=8000)
        full_prompt = "\n".join(full_prompt)
    
    return full_prompt, tone_label