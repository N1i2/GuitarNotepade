namespace Application.Exceptions.Base;

public class BaseException(string message) : Exception($"Application Error - {message}") { }
