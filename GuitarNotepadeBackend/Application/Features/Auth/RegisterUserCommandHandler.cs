using Domain.Entities;
using Domain.Interfaces.Services;
using MediatR;
using Domain.Interfaces;
using Application.Validations;
using Application.DTOs.Users;
using Application.Features.Commands.Users;

namespace Application.Features.Auth;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthService _authService;

    public RegisterUserCommandHandler(IUnitOfWork unitOfWork, IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _authService = authService;
    }

    public async Task<AuthResponseDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        await RegistrationValidate.isValid(request, _unitOfWork, cancellationToken);

        var passwordHash = _authService.HashPassword(request.Password);
        var user = User.Create(
            request.Email,
            request.NikName,
            passwordHash,
            "User");

        await _unitOfWork.Users.CreateNewAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = await _authService.GenerateJwtTokenAsync(user);

        return new AuthResponseDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            token);
    }
}
