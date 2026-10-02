from fastapi import APIRouter

router = APIRouter()

@router.get('/health')
def health():
    return {"status": "ok"}


# we create a different route for health to create a structured route paths.
# included in @app.get/post by app.include_router(health.router) in main.py