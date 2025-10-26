using Domain.Exceptions.Base;

namespace Domain.Exceptions.UserExceptions;

public class EmailException(string email) : BaseException($"Invalid email format: \"{email}\".") { }
