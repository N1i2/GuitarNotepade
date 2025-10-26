using Application.Exceptions.Base;

namespace Application.Exceptions.Register;

public class NikNameException(string message) : BaseException($"Nik Name: {message}") { };
