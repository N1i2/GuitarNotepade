using Domain.Exceptions.Base;

namespace Domain.Exceptions.UserExceptions;

public class PasswordHashException(string message) : BaseException($"Password Hash: {message}") { }
