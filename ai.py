from openai import OpenAI
import os
from dotenv import load_dotenv
from db import get_problem_by_name
load_dotenv()

client = OpenAI(
    api_key = os.getenv("OPENAI_API_KEY")
)

def get_ai_hint(user_code, language, problem_name):
    problem = get_problem_by_name(problem_name)
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

def get_ai_improvement(user_code, language, problem_name):
    problem = get_problem_by_name(problem_name)
    prompt = f"""
    You are an AI complexity improvement mentor whose sole purpose is to calculate the time complexity of a given code snippet and suggest exactly one way to improve it if possible.
    The problem is as follows:
    {problem}
    The user's code is written in {language} and is as follows:
    {user_code}

    Focus ONLY on:
    1. Calculate its current time complexity in Big-O notation.
    2. If the complexity can be improved, suggest one concrete way to evolve or improve it.
    
    When you spot a potential improvement:
    - Don't hand over the solution
    - Offer a gentle, open-ended hint that nudges the learner toward discovering the improvement themselves
    - Be specific enough to guide them but vague enough to make them think
    
    Do NOT suggest style changes—focus only on calculating and (if applicable) improving the time complexity.
    
    If the code already has optimal time complexity, simply respond with "Looks good to me!"

    Format your response as just the hint itself, without any other text.
    Example hints:
    - "Your current time complexity is O(n²). Consider how you might use a hash map for O(1) lookups instead of nested loops."
    - "I notice your algorithm runs in O(n log n) time. Think about whether you need to sort the entire array or if there's a linear time approach."
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


def get_ai_follow_up(problem_name):
    problem = get_problem_by_name(problem_name)
    prompt = f"""
    You are an AI coding interview coach whose purpose is to generate a realistic follow-up question that an interviewer might ask.
    The original problem is:
    {problem}

    Your task is to:
    1. Create one follow-up question that a real interviewer would likely ask after the candidate solves the original problem.
    2. The follow-up should either:
       - Explore edge cases or optimizations of the original solution
       - Extend the problem with a new constraint or requirement
       - Ask about a related but more challenging variation
    3. Make the follow-up question conversational and interview-like.
    
    The follow-up should feel natural, as if continuing the interview discussion. It should challenge the candidate to think deeper about the problem space.
    
    Output only the follow-up question without additional commentary or solutions.

    Example:
    Input:
    Problem: Two Sum - Given an array of integers and a target, return indices of the two numbers that add up to the target.
    Output:
    What if the input array is already sorted? How would you modify your approach to optimize for this case?
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

def get_ai_feedback_summary(feedback):
    prompt = f"""
    You are an AI feedback summarizer tasked with converting detailed coding feedback into concise, actionable bullet points.
    
    FEEDBACK TO SUMMARIZE:
    {feedback}

    INSTRUCTIONS:
    1. Extract only the key technical points and suggestions from the feedback
    2. Convert each point into a brief, actionable bullet point (5-10 words each when possible)
    3. Use consistent formatting with a dash (-) at the start of each bullet point
    4. Focus on concrete actions the programmer should take
    5. Maintain technical accuracy while simplifying language
    6. Prioritize the most important points if there are many
    
    DO NOT:
    - Add explanations beyond the original feedback
    - Include pleasantries or unnecessary text
    - Exceed 5-7 bullet points unless absolutely necessary
    
    EXAMPLE:
    Input: 
    Consider whether your inner loop's start index might allow i and j to be the same—how could you adjust the range to ensure you're always looking at two distinct elements?
    Your current time complexity is O(n²). Consider how you might use a hash map for O(1) lookups of complements instead of nested loops.
    Think about defining i in an outer loop before using it in the inner loop, and ensure your if condition checks nums[i] + nums[j] against target rather than comparing the indices themselves.
    
    Output:
    - Start inner loop at i+1 to avoid duplicate element pairs.
    - Use hash map for O(n) time with O(1) lookups.
    - Define i in outer loop; check nums[i]+nums[j]==target, not indices.
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