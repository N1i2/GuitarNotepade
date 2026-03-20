using System.Net;

namespace Infrastructure.Handlers;

public class RetryHandler : DelegatingHandler
{
    private readonly int _maxRetries = 3;
    private readonly int _initialDelayMs = 1000;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        HttpResponseMessage? response = null;
        var delay = _initialDelayMs;
        var retryCount = 0;

        while (retryCount < _maxRetries)
        {
            try
            {
                response = await base.SendAsync(request, cancellationToken);

                if (response.IsSuccessStatusCode ||
                    response.StatusCode == HttpStatusCode.NotFound ||
                    response.StatusCode == HttpStatusCode.Conflict ||
                    response.StatusCode == HttpStatusCode.BadRequest)
                {
                    return response;
                }

                // Повторяем при таймаутах и некоторых серверных ошибках
                if (response.StatusCode == HttpStatusCode.RequestTimeout ||
                    response.StatusCode == (HttpStatusCode)408 ||
                    response.StatusCode == HttpStatusCode.GatewayTimeout ||
                    response.StatusCode == HttpStatusCode.ServiceUnavailable)
                {
                    retryCount++;
                    if (retryCount >= _maxRetries) break;

                    await Task.Delay(delay, cancellationToken);
                    delay *= 2;
                    continue;
                }

                return response;
            }
            catch (TaskCanceledException) when (retryCount < _maxRetries - 1)
            {
                retryCount++;
                await Task.Delay(delay, cancellationToken);
                delay *= 2;
                continue;
            }
            catch (Exception) when (retryCount < _maxRetries - 1)
            {
                retryCount++;
                await Task.Delay(delay, cancellationToken);
                delay *= 2;
                continue;
            }
            catch
            {
                throw;
            }
        }

        return response ?? throw new Exception("Max retries exceeded");
    }
}