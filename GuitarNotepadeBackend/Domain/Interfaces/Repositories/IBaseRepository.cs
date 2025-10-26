﻿using Domain.Entities.Base;
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IBaseRepository<T> where T : BaseEntityWithId
{
    Task<List<T>> GetAll(CancellationToken cancellationToken = default);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<T?> CreateNewAsync(T newObj, CancellationToken cancellationToken = default);
    Task<T?> UpdateByIdAsync(Guid id, T newObj, CancellationToken cancellationToken = default);
    Task<T?> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}