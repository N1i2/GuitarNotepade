using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Application.Exceptions.Register;
using Microsoft.AspNetCore.Http;
using System.Diagnostics;
using System.ComponentModel.DataAnnotations;

namespace Presentation.Filters;

public class CustomExceptionFilter : IExceptionFilter
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<CustomExceptionFilter> _logger;

    public CustomExceptionFilter(IWebHostEnvironment environment, ILogger<CustomExceptionFilter> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        var exception = context.Exception;
        var errorResponse = CreateErrorResponse(exception, context.HttpContext);

        LogException(exception, errorResponse);

        context.Result = new ObjectResult(errorResponse)
        {
            StatusCode = errorResponse.StatusCode
        };

        context.ExceptionHandled = true;
    }

    private ApiErrorResponse CreateErrorResponse(Exception exception, HttpContext httpContext)
    {
        var errorResponse = exception switch
        {
            EmailException emailEx => new ApiErrorResponse(
                exceptionType: nameof(EmailException),
                message: emailEx.Message,
                statusCode: StatusCodes.Status400BadRequest),

            PasswordException passwordEx => new ApiErrorResponse(
                exceptionType: nameof(PasswordException),
                message: passwordEx.Message,
                statusCode: StatusCodes.Status400BadRequest),

            NikNameException nikNameEx => new ApiErrorResponse(
                exceptionType: nameof(NikNameException),
                message: nikNameEx.Message,
                statusCode: StatusCodes.Status400BadRequest),

            ValidationException validationEx => new ApiErrorResponse(
                exceptionType: nameof(ValidationException),
                message: validationEx.Message, 
                statusCode: StatusCodes.Status400BadRequest),

            UnauthorizedAccessException authEx => new ApiErrorResponse(
                exceptionType: nameof(UnauthorizedAccessException),
                message: "Access denied",
                statusCode: StatusCodes.Status401Unauthorized),

            KeyNotFoundException notFoundEx => new ApiErrorResponse(
                exceptionType: nameof(KeyNotFoundException),
                message: notFoundEx.Message,
                statusCode: StatusCodes.Status404NotFound),

            _ => new ApiErrorResponse(
                exceptionType: exception.GetType().Name,
                message: _environment.IsDevelopment() ? exception.Message : "An unexpected error occurred",
                statusCode: StatusCodes.Status500InternalServerError,
                stackTrace: _environment.IsDevelopment() ? exception.StackTrace : null)
        };

        errorResponse.Path = httpContext.Request.Path;
        errorResponse.RequestId = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        return errorResponse;
    }

    private void LogException(Exception exception, ApiErrorResponse errorResponse)
    {
        if (errorResponse.StatusCode >= 500)
        {
            _logger.LogError(exception, "Server error: {ExceptionType} - {Message}",
                errorResponse.ExceptionType, errorResponse.Message);
        }
        else
        {
            _logger.LogWarning("Client error: {ExceptionType} - {Message} - Status: {StatusCode}",
                errorResponse.ExceptionType, errorResponse.Message, errorResponse.StatusCode);
        }
    }
}