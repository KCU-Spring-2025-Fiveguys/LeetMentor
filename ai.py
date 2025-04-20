from openai import OpenAI
import os
from dotenv import load_dotenv
from db import get_problem_by_id
load_dotenv()

client = OpenAI(
    api_key = os.getenv("OPENAI_API_KEY")
)

def get_ai_hint(user_code, language, problem_id):
    problem = get_problem_by_id(problem_id)
    prompt = f"""
    You are an AI mentor whose sole purpose is to verify that submitted code runs without errors and that its logic is sound.
    The problem is as follows:
    {problem}
    The user's code is written in {language} and is as follows:
    {user_code}

    Focus ONLY on:
    1. Making sure the code runs without errors
    2. Verifying that the logic correctly solves the problem
    
    When you spot a problem:
    - Don't hand over the solution
    - Offer a gentle, open-ended hint that nudges the learner toward discovering the fix themselves
    - Be specific enough to guide them but vague enough to make them think
    
    Do NOT suggest performance or style changes—focus only on helping them arrive at a correct, error-free program.
    
    If the code appears logically correct, simply respond with "Looks good to me!"

    Format your response as just the hint itself, without any other text.
    Example hints:
    - "Make sure your blocks are indented consistently—remember that everything inside a loop or conditional must line up!"
    - "Check the index of the loop. What is the purpose of the variable i?"
    - "Consider the condition in your if statement carefully. Is it checking what you think it's checking?"
    """

    response = client.responses.create(
        model="o4-mini",
        reasoning={"effort": "medium"},
        input=[
            {
                "role": "user", 
                "content": prompt
            }
        ]
    )

    return response.output_text

def get_ai_improvement(user_code, language, problem_id):
    problem = get_problem_by_id(problem_id)
    prompt = f"""
    // TODO: Implement this
    """
    response = client.responses.create(
    model="o4-mini",
    reasoning={"effort": "medium"},
    input=[
        {
            "role": "user", 
            "content": prompt
        }
    ]
    )
    return response.output_text


def get_ai_follow_up(problem_id):
    problem = get_problem_by_id(problem_id)
    prompt = f"""
    // TODO: Implement this
    """
    response = client.responses.create(
    model="o4-mini",
    reasoning={"effort": "medium"},
    input=[
        {
            "role": "user", 
            "content": prompt
        }
    ]
    )
    return response.output_text