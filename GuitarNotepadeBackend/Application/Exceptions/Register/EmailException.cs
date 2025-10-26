using Application.Exceptions.Base;

namespace Application.Exceptions.Register;

public class EmailException(string message) : BaseException($"Email: {message}") { };
