# Stage 1: Build frontend
FROM node:24-alpine AS frontend-build
WORKDIR /frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
# Override outDir to write to /wwwroot (not relative to source tree)
RUN npm run build -- --outDir /wwwroot

# Stage 2: Build backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY TimeReport.slnx ./
COPY Backend/TimeReport.Api/TimeReport.Api.csproj Backend/TimeReport.Api/
RUN dotnet restore Backend/TimeReport.Api/TimeReport.Api.csproj
COPY Backend/TimeReport.Api/ Backend/TimeReport.Api/
COPY --from=frontend-build /wwwroot Backend/TimeReport.Api/wwwroot/
RUN dotnet publish Backend/TimeReport.Api/TimeReport.Api.csproj \
    -c Release -o /publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
RUN useradd --no-create-home appuser && chown appuser /app
RUN mkdir -p /app/data /app/backup && chown appuser /app/data /app/backup
USER appuser
COPY --from=backend-build /publish ./
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "TimeReport.Api.dll"]
