using Application.DTOs.Users;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace Application.Features.Queries.Users;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, PaginatedResultDto<UserProfileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;

    public GetAllUsersQueryHandler(IUnitOfWork unitOfWork, IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
    }

    public async Task<PaginatedResultDto<UserProfileDto>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Users.GetQueryable();
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.EmailFilter))
        {
            query = query.Where(u => u.Email.Contains(request.EmailFilter));
        }

        if (!string.IsNullOrWhiteSpace(request.NikNameFilter))
        {
            query = query.Where(u => u.NikName.Contains(request.NikNameFilter));
        }

        if (request.IsBlocked.HasValue)
        {
            if (request.IsBlocked.Value)
            {
                query = query.Where(u => u.BlockedUntil.HasValue && u.BlockedUntil.Value > now);
            }
            else
            {
                query = query.Where(u => !u.BlockedUntil.HasValue || u.BlockedUntil.Value <= now);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            query = query.Where(u => u.Role == request.Role);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySorting(query, request.SortBy, request.SortOrder);

        var users = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            user.CheckAndClearExpiredBlock();
        }

        var avatarUrls = await GetAvatarUrlsBatch(users, cancellationToken);

        var result = users.Select((user, index) => new UserProfileDto(
            user.Id,
            user.Email,
            user.NikName,
            user.Role,
            avatarUrls[index],
            user.Bio,
            user.CreateAt,
            user.BlockedUntil.HasValue && user.BlockedUntil.Value > now,
            user.BlockedUntil,
            user.BlockReason))
            .ToList();

        return PaginatedResultDto<UserProfileDto>.Create(
            result, totalCount, request.Page, request.PageSize);
    }

    private IQueryable<User> ApplySorting(IQueryable<User> query, string sortBy, string sortOrder)
    {
        var isAscending = sortOrder.ToLower() == Constants.Sorting.Ascending;

        return sortBy.ToLower() switch
        {
            Constants.Sorting.Email => isAscending
                ? query.OrderBy(u => u.Email)
                : query.OrderByDescending(u => u.Email),

            Constants.Sorting.NikName => isAscending
                ? query.OrderBy(u => u.NikName)
                : query.OrderByDescending(u => u.NikName),

            Constants.Sorting.CreatedAt => isAscending
                ? query.OrderBy(u => u.CreateAt)
                : query.OrderByDescending(u => u.CreateAt),

            _ => query.OrderByDescending(u => u.CreateAt)
        };
    }

    private async Task<List<string>> GetAvatarUrlsBatch(List<User> users, CancellationToken cancellationToken)
    {
        var tasks = users.Select(user =>
            _webDavService.GetAvatarUrlAsync(user.AvatarUrl ?? ""))
            .ToList();

        return (await Task.WhenAll(tasks)).ToList();
    }
}