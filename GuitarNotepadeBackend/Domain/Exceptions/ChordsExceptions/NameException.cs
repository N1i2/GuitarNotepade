using Domain.Exceptions.Base;

namespace Domain.Exceptions.ChordsExceptions;

public class NameException(string message) : BaseException($"Chords Name: {message}") { }
