namespace Presentation.Filters;

public class ApiErrorResponse
{
    public string ExceptionType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? StackTrace { get; set; }
    public string? Path { get; set; }
    public string? RequestId { get; set; }

    public ApiErrorResponse() { }

    public ApiErrorResponse(string exceptionType, string message, int statusCode, string? stackTrace = null)
    {
        ExceptionType = exceptionType;
        Message = message;
        StatusCode = statusCode;
        StackTrace = stackTrace;
        Timestamp = DateTime.UtcNow;
    }
}