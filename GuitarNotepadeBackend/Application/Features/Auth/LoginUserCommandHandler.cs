using Domain.Interfaces.Services;
using Domain.Interfaces;
using MediatR;
using Application.Validations;
using Application.DTOs.Users;
using Application.Features.Commands.Users;

namespace Application.Features.Auth;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthService _authService;

    public LoginUserCommandHandler(IUnitOfWork unitOfWork, IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _authService = authService;
    }

    public async Task<AuthResponseDto> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var user = await LoginValidation.isValid(request, _unitOfWork, _authService, cancellationToken);

        var token = await _authService.GenerateJwtTokenAsync(user);

        return new AuthResponseDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            token);
    }
}