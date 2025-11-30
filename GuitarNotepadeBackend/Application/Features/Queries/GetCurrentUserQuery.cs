using Application.DTOs;
using MediatR;

namespace Application.Features.Queries;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto>;