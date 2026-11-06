"""Sign-up (parents only), login and password management."""
from fastapi import APIRouter, Depends, Request, status

from dependencies import get_auth_service
from models import User
from schemas import (
    ChangePasswordIn,
    ForgotPasswordIn,
    LoginIn,
    MessageOut,
    RegisterIn,
    RegisterOut,
    ResetPasswordIn,
    TokenOut,
    UserOut,
)
from security import create_token, get_current_user
from services.auth import GENERIC_RESET_ANSWER, AuthService
from services.presenters import guardian_out, player_out, user_out

router = APIRouter(prefix="/auth", tags=["autenticación"])


@router.post(
    "/register",
    response_model=RegisterOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registro del padre de familia con uno o varios hijos",
    description=(
        "Crea la cuenta del acudiente, su perfil, sus hijos (inscripción **pendiente** hasta que un admin la "
        "apruebe) y las autorizaciones de datos. Todo en una sola transacción. Devuelve el token de sesión."
    ),
)
def register(data: RegisterIn, request: Request, service: AuthService = Depends(get_auth_service)):
    user, guardian, players = service.register_parent(
        data, ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent")
    )
    return RegisterOut(
        access_token=create_token(user),
        user=user_out(user),
        guardian=guardian_out(guardian),
        players=[player_out(p) for p in players],
    )


@router.post("/login", response_model=TokenOut, summary="Iniciar sesión (cualquier rol)")
def login(data: LoginIn, service: AuthService = Depends(get_auth_service)):
    user = service.login(data.email, data.password)
    return TokenOut(access_token=create_token(user), user=user_out(user))


@router.get("/me", response_model=UserOut, summary="Usuario de la sesión actual")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@router.post("/password/change", response_model=MessageOut, summary="Cambiar la contraseña (con sesión)")
def change_password(
    data: ChangePasswordIn, user: User = Depends(get_current_user), service: AuthService = Depends(get_auth_service)
):
    service.change_password(user, data)
    return MessageOut(detail="Contraseña actualizada.")


@router.post("/password/forgot", response_model=MessageOut, summary="Pedir un código para restablecer la contraseña")
def forgot_password(data: ForgotPasswordIn, service: AuthService = Depends(get_auth_service)):
    service.request_password_reset(data.email)
    return MessageOut(detail=GENERIC_RESET_ANSWER)


@router.post("/password/reset", response_model=MessageOut, summary="Restablecer la contraseña con el código")
def reset_password(data: ResetPasswordIn, service: AuthService = Depends(get_auth_service)):
    service.reset_password(data.email, data.code, data.new_password)
    return MessageOut(detail="Contraseña restablecida. Ya puedes iniciar sesión.")
