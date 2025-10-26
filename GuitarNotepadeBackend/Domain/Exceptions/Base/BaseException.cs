namespace Domain.Exceptions.Base;

public class BaseException(string message) : Exception($"Domain Error - {message}") { }
