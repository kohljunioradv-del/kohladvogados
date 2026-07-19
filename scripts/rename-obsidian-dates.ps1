<#
.SYNOPSIS
    Renomeia notas do Obsidian de DD-MM-AAAA.md para AAAA-MM-DD.md e atualiza
    wikilinks internos ([[DD-MM-AAAA]], ![[DD-MM-AAAA]], com ou sem alias/heading)
    em todo o cofre.

.DESCRIPTION
    Por padrao roda em modo "dry run": mostra o que seria renomeado/atualizado
    sem tocar em nada. Use -Apply para executar de verdade.

    Recomenda-se fechar o Obsidian antes de rodar com -Apply, e usar -Backup
    na primeira execucao para gerar um .zip de seguranca do cofre.

.PARAMETER VaultPath
    Caminho raiz do cofre Obsidian (ex: "C:\Users\SeuUsuario\Documents\Obsidian Vault").

.PARAMETER Apply
    Sem essa flag, o script so mostra o plano de renomeacao (dry run).
    Com -Apply, executa as mudancas de fato.

.PARAMETER Backup
    Cria um .zip com timestamp do VaultPath antes de aplicar as mudancas.
    So tem efeito junto com -Apply.

.EXAMPLE
    .\rename-obsidian-dates.ps1 -VaultPath "C:\Users\SeuUsuario\Documents\Obsidian Vault"
    (dry run - so mostra o que seria feito)

.EXAMPLE
    .\rename-obsidian-dates.ps1 -VaultPath "C:\Users\SeuUsuario\Documents\Obsidian Vault" -Backup -Apply
    (faz backup e aplica as mudancas)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$VaultPath,

    [switch]$Apply,

    [switch]$Backup
)

if (-not (Test-Path -LiteralPath $VaultPath -PathType Container)) {
    throw "Pasta do cofre nao encontrada: $VaultPath"
}
$VaultPath = (Resolve-Path -LiteralPath $VaultPath).Path

Write-Host "Cofre: $VaultPath" -ForegroundColor Cyan
Write-Host $(if ($Apply) { "Modo: APLICANDO mudancas" } else { "Modo: DRY RUN (nada sera alterado)" }) -ForegroundColor Yellow

# 1. Encontra todos os .md do cofre inteiro
$allMdFiles = Get-ChildItem -LiteralPath $VaultPath -Filter '*.md' -Recurse -File

# 2. Identifica arquivos com nome DD-MM-AAAA.md e valida como data real
$dateNamePattern = '^(?<d>\d{2})-(?<m>\d{2})-(?<y>\d{4})$'
$renamePlan = @()

foreach ($file in $allMdFiles) {
    $base = $file.BaseName
    if ($base -match $dateNamePattern) {
        $d = $Matches['d']; $m = $Matches['m']; $y = $Matches['y']
        $parsedDate = [datetime]::MinValue
        $parsedOk = [datetime]::TryParseExact("$y-$m-$d", 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref]$parsedDate)
        if (-not $parsedOk) {
            Write-Warning "Ignorando '$($file.FullName)': '$base' nao e uma data valida."
            continue
        }
        $newBase = "$y-$m-$d"
        $newPath = Join-Path $file.DirectoryName "$newBase.md"

        if (Test-Path -LiteralPath $newPath) {
            Write-Warning "Ignorando '$($file.FullName)': ja existe '$newPath'."
            continue
        }

        $renamePlan += [pscustomobject]@{
            OldFullPath = $file.FullName
            OldBase     = $base
            NewBase     = $newBase
            NewFullPath = $newPath
        }
    }
}

if ($renamePlan.Count -eq 0) {
    Write-Host "Nenhum arquivo no formato DD-MM-AAAA.md encontrado. Nada a fazer." -ForegroundColor Green
    return
}

Write-Host "`nArquivos a renomear ($($renamePlan.Count)):" -ForegroundColor Cyan
$renamePlan | ForEach-Object {
    Write-Host "  $($_.OldBase).md  ->  $($_.NewBase).md   [$($_.OldFullPath)]"
}

# 3. Atualiza wikilinks em TODOS os .md do cofre (inclusive nos que serao renomeados)
#    Formatos cobertos: [[DD-MM-AAAA]], [[DD-MM-AAAA|Alias]], [[DD-MM-AAAA#Heading]], ![[DD-MM-AAAA]]
$linkUpdates = 0
$filesWithLinkChanges = 0

foreach ($mdFile in $allMdFiles) {
    $content = Get-Content -LiteralPath $mdFile.FullName -Raw -ErrorAction SilentlyContinue
    if ([string]::IsNullOrEmpty($content)) { continue }

    $originalContent = $content
    foreach ($entry in $renamePlan) {
        $old = [regex]::Escape($entry.OldBase)
        # casa [[DD-MM-AAAA  seguido de ]], |, ou # -- preserva o resto do link
        $pattern = "\[\[$old(?=(\]\]|\||#))"
        $content = [regex]::Replace($content, $pattern, "[[$($entry.NewBase)")
    }

    if ($content -ne $originalContent) {
        $filesWithLinkChanges++
        $diffCount = ([regex]::Matches($originalContent, '\[\[')).Count
        $linkUpdates++
        if ($Apply) {
            Set-Content -LiteralPath $mdFile.FullName -Value $content -NoNewline -Encoding UTF8
        }
    }
}

Write-Host "`nArquivos com links internos a atualizar: $filesWithLinkChanges" -ForegroundColor Cyan

if (-not $Apply) {
    Write-Host "`nDry run concluido. Nada foi alterado." -ForegroundColor Yellow
    Write-Host "Revise o plano acima e rode novamente com -Apply (e de preferencia -Backup) para executar." -ForegroundColor Yellow
    return
}

# 4. Backup opcional antes de renomear os arquivos
if ($Backup) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $zipPath = Join-Path (Split-Path $VaultPath -Parent) "ObsidianVault-backup-$timestamp.zip"
    Write-Host "`nCriando backup em '$zipPath'..." -ForegroundColor Cyan
    Compress-Archive -Path (Join-Path $VaultPath '*') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host "Backup criado." -ForegroundColor Green
}

# 5. Renomeia os arquivos de fato
foreach ($entry in $renamePlan) {
    Rename-Item -LiteralPath $entry.OldFullPath -NewName "$($entry.NewBase).md"
}

Write-Host "`nConcluido: $($renamePlan.Count) arquivo(s) renomeado(s), $filesWithLinkChanges arquivo(s) com links atualizados." -ForegroundColor Green
