using Domain.Exceptions.Base;

namespace Domain.Exceptions.UserExceptions;

public class NikNameException(string message) : BaseException($"Nik Name: {message}") { }