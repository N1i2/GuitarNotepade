using MediatR;

namespace Application.Features.Queries;

public record GetUserProfileQuery(Guid UserId) : IRequest<UserProfileDto>;