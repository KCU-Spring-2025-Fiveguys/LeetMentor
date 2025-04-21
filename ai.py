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
    You are an AI complexity improvement mentor whose sole purpose is to calculate the time complexity of a given code snippet and suggest exactly one way to improve it if possible.
    The problem is as follows:
    {problem}
    The user's code is written in {language} and is as follows:
    {user_code}

    Focus ONLY on:
    1. Calculate its current time complexity in Big-O notation.
    2. If the complexity can be improved, suggest one concrete way to evolve or improve it.
    Format your response as just the hint itself, without any other text.

    When you spot a problem:
    - Don't hand over the solution
    - Offer a gentle, open-ended hint that nudges the learner toward discovering the fix themselves
    - Be specific enough to guide them but vague enough to make them think


    Example hints:
    - current time complexity is O(n²)
    - you can improve complexity by using a hash map for O(1) lookups

    Do NOT suggest performance or style changes—focus only on calculating and (if applicable) improving the complexity.
    If the code appear already optimal, simply respond with "Looks good to me! 😊"
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
    You are an AI coding problem mentor whose sole purpose is to generate a single follow-up question for a given coding problem and then validate a user's solution to that follow-up question.:
    {problem}

    
If the input includes only a problem title and description, output exactly one follow-up question (just the question text), with no additional commentary.
If the input includes a follow-up question and a user's proposed solution (code or description), output only one line:
• "Correct! 😊" if the solution is correct for standard test cases.
• Otherwise, "Incorrect. <concise hint>" where <concise hint> points to the error.

    I will give you the title and description of a coding problem. Your task is to:
    
Produce one follow-up question that builds on the original problem, exploring a more advanced or broader concept but within the same domain.
 
 Do NOT provide full solutions or explanations. Do NOT include any other text.

    Example 1:
    Input:
    Problem: Two Sum - Given an array of integers and a target, return indices of the two numbers that add up to the target.
    Output:
    Three Sum

    Example 2:
    Input:
    Follow-up: Three Sum - Given an array of integers, return all unique triplets that sum to zero.
    User Solution: [user's code]
    Output:
    Correct! 😊
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
