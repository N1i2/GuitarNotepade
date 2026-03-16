using MediatR;

namespace Application.Features.Queries.Users;

public record GetUserByEmailQuery(string email) : IRequest<UserProfileDto>;
