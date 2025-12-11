using Domain.Entities;
using Domain.Interfaces.Services;
using Domain.Interfaces;
using MediatR;
using System.ComponentModel.DataAnnotations;
using Application.DTOs.Users;
using Application.Features.Commands.Users;

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
        if (await _unitOfWork.Users.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            throw new ValidationException("User with this email already exists");
        }

        if (await _unitOfWork.Users.ExistsByNikNameAsync(request.NikName, cancellationToken))
        {
            throw new ValidationException("User with this nickname already exists");
        }

        User user = User.Create(
            request.Email,
            request.NikName,
            _authService.HashPassword(request.Password),
            "User");

        await _unitOfWork.Users.CreateNewAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = await _authService.GenerateJwtTokenAsync(user);

        return new AuthResponseDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            token
        );
    }
}