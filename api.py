from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ai import get_ai_hint, get_ai_follow_up, get_ai_improvement, get_ai_feedback_summary
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
    problem_name: str
    language: str
    user_code: str

class FollowUpSubmission(BaseModel):
    problem_name: str

class HistorySubmission(BaseModel):
    feedback: str

@app.post("/get_hint")
async def execute_code(submission: CodeSubmission):
    result = get_ai_hint(submission.user_code, submission.language, submission.problem_name)
    return {"response": result}

@app.post("/get_follow_up")
async def execute_code(submission: FollowUpSubmission):
    result = get_ai_follow_up(submission.problem_name)
    return {"response": result}

@app.post("/get_improvement")
async def execute_code(submission: CodeSubmission):
    result = get_ai_improvement(submission.user_code, submission.language, submission.problem_name)
    return {"response": result}

@app.post("/get_feedback_summary")
async def execute_code(submission: HistorySubmission):
    result = get_ai_feedback_summary(submission.feedback)
    return {"response": result}


# Add a root route for health check
@app.get("/")
async def read_root():
    return {"status": "ok", "message": "LeetMentor API is running"}


