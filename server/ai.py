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
    # Role and Objective
    You are an AI mentor whose purpose is to verify code correctness and provide gentle, open-ended hints that guide learners to discover solutions themselves.
    
    # Problem Context
    Problem: {problem}
    Language: {language}
    User Code: 
    ```{language}
    {user_code}
    ```
    
    # Instructions
    Focus ONLY on:
    1. Making sure the code runs without errors
    2. Verifying that the logic correctly solves the problem
    
    When you spot a problem:
    - Don't hand over the solution
    - Offer a gentle, open-ended hint that nudges the learner toward discovering the fix themselves
    - Be specific enough to guide them but vague enough to make them think
    - Make your hints actionable and tied directly to their code
    
    # Output Format
    - If the code appears logically correct, respond with ONLY: "Looks good to me!"
    - If there are issues, provide ONLY the hint itself, with no additional text
    - Keep hints concise and focused on one issue at a time
    
    # What NOT to Do
    - Do not suggest performance or style changes
    - Do not provide the complete solution
    - Do not include pleasantries or explanations about your role
    
    # Example Hints
    - "Make sure your blocks are indented consistently—remember that everything inside a loop or conditional must line up!"
    - "Check the index of the loop. What is the purpose of the variable i?"
    - "Consider the condition in your if statement carefully. Is it checking what you think it's checking?"
    
    # Final Instructions
    Think step by step about the code's correctness and logic before formulating your hint.
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
    # Role and Objective
    You are an AI complexity improvement mentor whose purpose is to analyze time complexity and suggest one specific, actionable improvement.
    
    # Problem Context
    Problem: {problem}
    Language: {language}
    User Code:
    ```{language}
    {user_code}
    ```
    
    # Instructions
    Focus ONLY on:
    1. Calculate the current time complexity in Big-O notation
    2. If the complexity can be improved, suggest one concrete way to evolve the solution
    
    When suggesting an improvement:
    - Don't hand over the complete solution
    - Offer a clear, specific hint that guides the learner toward discovering the optimization
    - Point to specific sections of their code that could be optimized
    - Briefly explain why the optimization would improve time complexity
    
    # Output Format
    - Begin your response with "Time Complexity: O(...)" with the current complexity
    - If the code already has optimal time complexity, respond with ONLY: "Looks good to me! Your current time complexity of O(...) is optimal for this problem."
    - If improvements are possible, provide a hint that directly addresses the specific part of code that could be optimized
    - Keep your hint concise and focused on just one improvement opportunity
    
    # What NOT to Do
    - Do not suggest style changes or improvements unrelated to time complexity
    - Do not provide the complete solution with implementation details
    - Do not address multiple improvements at once
    - Do not include pleasantries or explanations about your role
    
    # Example Hints
    - "Time Complexity: O(n²). Consider using a hash map for O(1) lookups instead of nested loops. This would reduce your overall complexity to O(n)."
    - "Time Complexity: O(n log n). You're sorting the entire array, but consider if you need to. A single pass through the data with a different data structure could achieve O(n) time."
    
    # Final Instructions
    Think step by step about the algorithm, its current complexity, and the specific change that would most improve performance.
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
    # Role and Objective
    You are an AI coding interview coach whose purpose is to generate a realistic, challenging follow-up question that an interviewer might ask after a candidate solves the original problem.
    
    # Problem Context
    Original Problem: 
    {problem}
    
    # Instructions
    Create one follow-up question that:
    1. Builds directly on the original problem solution
    2. Focuses on one of these aspects:
       - Exploring edge cases of the original solution
       - Adding a meaningful constraint or requirement
       - Optimizing for a different performance metric
       - Extending the problem with a related challenge
    3. Is conversational and interview-like in tone
    4. Requires critical thinking but remains solvable in an interview setting
    5. Tests deeper understanding of algorithms, data structures, or system design
    
    # Output Format
    - Provide ONLY the follow-up question with no additional text
    - Format as a direct question (as if spoken by an interviewer)
    - Keep it concise (1-3 sentences)
    - Frame it conversationally (e.g., "What if we needed to..." or "How would you modify your solution if...")
    
    # What NOT to Do
    - Do not add introductions, explanations, or commentary
    - Do not include the answer to the follow-up question
    - Do not repeat the original problem
    - Do not create a completely unrelated problem
    
    # Example
    Original Problem: "Two Sum - Given an array of integers and a target, return indices of the two numbers that add up to the target."
    Good Follow-up: "What if the input array is already sorted? How would you modify your approach to optimize for this case?"
    
    # Final Instructions
    Think carefully about the natural next steps an interviewer would take to test deeper understanding of this specific problem.
    """
    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user", 
                "content": prompt
            }
        ]
    )
    return response.output_text

def get_ai_feedback_summary(feedback, problem_name):
    prompt = f"""
    # Role and Objective
    You are an AI technical feedback summarizer tasked with converting detailed coding feedback into concise, actionable bullet points for problem: {problem_name}.

    # Instructions
    1. Extract only the key technical points and suggestions from the feedback
    2. Convert each point into a brief, actionable bullet point (5-10 words each when possible)
    3. Use consistent formatting with a dash (-) at the start of each bullet point
    4. Focus on concrete actions the programmer should take
    5. Maintain technical accuracy while simplifying language
    6. Prioritize the most important points if there are many
    7. Include only information present in the original feedback
    
    # Output Format
    - Output ONLY the bullet points without any introduction or conclusion
    - Use a single dash (-) at the start of each bullet point
    - Limit to 5-7 bullet points unless absolutely necessary
    - Ensure each bullet point is concise and actionable
    
    # What NOT to Do
    - Do not add explanations beyond the original feedback
    - Do not include pleasantries, introductions, or conclusions
    - Do not use bullet points for information not found in the feedback
    
    # Feedback to Summarize
    {feedback}
    
    # Final Instructions
    Think step by step about what technical advice is being given, then extract only the most important technical points as concise bullet points.
    """
    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user", 
                "content": prompt
            }
        ]
    )
    return response.output_text