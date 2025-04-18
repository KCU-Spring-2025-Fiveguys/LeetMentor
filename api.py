from fastapi import FastAPI
from pydantic import BaseModel
from ai import get_ai_response

app = FastAPI()

class CodeSubmission(BaseModel):
    user_code: str

@app.post("/get_hint/{problem_id}/{language}")
async def execute_code(problem_id: str, language: str, submission: CodeSubmission):
    result = get_ai_response(submission.user_code, language, problem_id)
    return {"response": result}


