using Application.Exceptions.Base;

namespace Application.Exceptions.Register;

public class PasswordException(string message) : BaseException($"Password: {message}") { };
