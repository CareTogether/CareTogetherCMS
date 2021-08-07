# See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.
# More info at https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/building-net-docker-images?view=aspnetcore-5.0

FROM mcr.microsoft.com/dotnet/aspnet:5.0-alpine-amd64 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:5.0-alpine-amd64 AS build
WORKDIR /src
COPY ["src/CareTogether.Api/CareTogether.Api.csproj", "src/CareTogether.Api/"]
COPY ["test/CareTogether.TestData/CareTogether.TestData.csproj", "test/CareTogether.TestData/"]
COPY ["src/CareTogether.Core/CareTogether.Core.csproj", "src/CareTogether.Core/"]
COPY ["src/CareTogether.Contracts/CareTogether.Contracts.csproj", "src/CareTogether.Contracts/"]
RUN dotnet restore "src/CareTogether.Api/CareTogether.Api.csproj"
COPY . .
WORKDIR "/src/src/CareTogether.Api"
RUN dotnet build "CareTogether.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CareTogether.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CareTogether.Api.dll"]