using Application.DTOs;
using Domain.Common;
using MediatR;

namespace Application.Features.Queries;

public class GetAllUsersQuery : IRequest<PaginatedResultDto<UserProfileDto>>
{
    public string? EmailFilter { get; }
    public string? NikNameFilter { get; }
    public bool? IsBlocked { get; }
    public string? Role { get; }
    public int Page { get; }
    public int PageSize { get; }
    public string SortBy { get; }
    public string SortOrder { get; }

    public GetAllUsersQuery(
        string? emailFilter = null,
        string? nikNameFilter = null,
        bool? isBlocked = null,
        string? role = null,
        int page = 1,
        int pageSize = Constants.DefaultPageSize,
        string sortBy = Constants.Sorting.CreatedAt,
        string sortOrder = Constants.Sorting.Descending)
    {
        EmailFilter = emailFilter;
        NikNameFilter = nikNameFilter;
        IsBlocked = isBlocked;
        Role = role;
        Page = page;
        PageSize = pageSize;
        SortBy = sortBy;
        SortOrder = sortOrder;
    }
}