using MediatR;

namespace Application.Features.Queries.Users;

public record GetUserProfileQuery(Guid UserId) : IRequest<UserProfileDto>;