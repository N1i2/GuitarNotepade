using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongRelationExceptions;

public class SameIdException(string message) : BaseException($"Same Id: {message}") { }
