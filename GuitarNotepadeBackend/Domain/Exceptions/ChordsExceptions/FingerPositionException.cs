using Domain.Exceptions.Base;

namespace Domain.Exceptions.ChordsExceptions;

public class FingerPositionException(string message) : BaseException($"Chords Finger Position: {message}") { }
