using Domain.Entities;
using Domain.Interfaces.Services;
using Domain.Interfaces;
using MediatR;
using System.ComponentModel.DataAnnotations;
using Application.DTOs.Users;
using Application.Features.Commands.Users;
using Application.Features.Commands.Alboms;

namespace Application.Validations;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthService _authService;
    private readonly IMediator _mediator;

    public RegisterUserCommandHandler(
        IUnitOfWork unitOfWork,
        IAuthService authService,
        IMediator mediator) 
    {
        _unitOfWork = unitOfWork;
        _authService = authService;
        _mediator = mediator;
    }

    public async Task<AuthResponseDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        try
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

            await _unitOfWork.Users.CreateAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await CreateFavoriteAlbumForUser(user.Id, cancellationToken);

            var token = await _authService.GenerateJwtTokenAsync(user);

            return new AuthResponseDto(
                user.Id,
                user.Email,
                user.NikName,
                user.Role,
                token
            );
        }
        catch (Exception)
        {
            throw;
        }
    }

    private async Task CreateFavoriteAlbumForUser(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var createAlbumCommand = new CreateAlbumCommand(
                userId: userId,
                title: "Favorite");

            await _mediator.Send(createAlbumCommand, cancellationToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to create favorite album for user {userId}: {ex.Message}");
        }
    }
}