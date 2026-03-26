using Application.Exceptions.Base;

namespace Application.Exceptions;

public class ForbiddenAccessException : BaseException
{
    public ForbiddenAccessException() : base("You don't have permission to access this resource") { }

    public ForbiddenAccessException(string message) : base(message) { }
}