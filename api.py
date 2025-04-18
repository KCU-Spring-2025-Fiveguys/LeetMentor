from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ai import get_ai_response
from db import get_problem_by_id
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class CodeSubmission(BaseModel):
    user_code: str

@app.post("/get_hint/{problem_id}/{language}")
async def execute_code(problem_id: str, language: str, submission: CodeSubmission):
    result = get_ai_response(submission.user_code, language, problem_id)
    return {"response": result}

# Add a root route for health check
@app.get("/")
async def read_root():
    return {"status": "ok", "message": "LeetMentor API is running"}


