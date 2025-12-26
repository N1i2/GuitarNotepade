FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["*.sln", "./"]
COPY ["Presentation/Presentation.csproj", "Presentation/"]
COPY ["Application/Application.csproj", "Application/"]
COPY ["Domain/Domain.csproj", "Domain/"]
COPY ["Infrastructure/Infrastructure.csproj", "Infrastructure/"]

RUN dotnet restore "Presentation/Presentation.csproj"
RUN dotnet tool install --global dotnet-ef --version 8.0.0
ENV PATH="$PATH:/root/.dotnet/tools"

COPY . .
WORKDIR "/src/Presentation"
RUN dotnet build "Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Устанавливаем переменные окружения
ENV ASPNETCORE_URLS=http://*:3001
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=3001

# Копируем dotnet tools
COPY --from=build /root/.dotnet/tools /root/.dotnet/tools
ENV PATH="$PATH:/root/.dotnet/tools"

EXPOSE 3001
ENTRYPOINT ["dotnet", "Presentation.dll"]