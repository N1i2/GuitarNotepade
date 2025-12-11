using Application.DTOs;
using MediatR;

namespace Application.Features.Queries.Users;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto>;