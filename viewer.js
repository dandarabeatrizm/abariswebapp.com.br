// Configuração do PDF.js (define o caminho para os workers)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// URL do PDF que você quer carregar
const pdfUrl = 'https://cse-abaris-fileserver.s3.amazonaws.com/STORAGE/XML%20DIPLOMADO/2/057a0809-afda-4aa1-b1f7-1b7aaa4f1268.pdf?AWSAccessKeyId=ASIAYJY2E2K23QARCY44&Expires=1754464190&x-amz-security-token=IQoJb3JpZ2luX2VjEBwaCXVzLWVhc3QtMSJGMEQCIDRXVFWNweV1yh0s3BI9YdPuQAKdhIpSwT4nFDYNic0eAiBHnt26kri9fDJ1WNwLRljcwp2VKz%2FcdPeKSpeQg00GqSrrAwhVEAMaDDU3MDc0ODYyMTQ5MyIMRZmzvfyu3HGhfvR2KsgD%2BN1pWwlLWeONRKsA3wXt5rZaI82Darn42O%2B%2FZnQ1g6G0uxzWL1wuEcN8a14v%2B0rLEeuXk6HpTegWLFWXCwHVsvpcDxHwanYSqIBvO1LAGk7VwPfTRqpOe5EaTRvuedXPD0OtLdT0AnF%2FUSGsATHX4GdJReolgJIFJLlkAcmbaArWePe6SjhRBB7LZ%2BJZnjo%2FvI3MGoW3UEOp1c8aImjO9vgSzdxHYuH8%2B%2BRc36P5FroLHKgLxam1NUwafanRXmJoYDRs7thEDzpArsWIsVb7m223Boz919E%2BPlxrydDPIZe%2BcPO0YvvvfmiuQPIbT5UhHGFsNaX2cSpOwOyb534iyD1lZpmKDeVkIKi7hqCfZ9tcFhsAWYnH1FJMWuo5%2BMHFSiCXM1%2F40uj6574xpMSZe3VqddxXrA1%2BAcgt9A3NQX3gvOS3QAMo9BkikVpHsgaZUcKqee47l%2BeaFfAIRd7nkFCQaZ2yM7cvTC%2FvzQI1BCn2CO11Mjeu3EQSqOne8pcli1uGspzGL%2F4P%2B7jNWMy2S52ewgI1trk3Dt7bE6W2YJfR9jAnjWojiaTFZqbkcIbepYd7LGaM1%2FSpegAhuEk8M4YaGxfMSlA%2BMOX%2FxcQGOqYBp3QAGEQK9j5AXfBWWtenugwsxGrsbYUlGiTLtv84TSL6%2BPvnw9MXiqcZcoOzxn%2BHRmN0XkBLaRhx1FJGTPKpRuLPpBbamBMUGcfc0dzF7%2FbZdKOsjuh8kbfAeyp8evPznDoZFo6wrTAq51W7fqKcANubPFLJtEwyCKqPE%2Bxk0fAYCQ4gKF7iy%2Bo732fnL%2BCqZcLCjIY2UyobOem2Bz10%2FojPFldidw%3D%3D&Signature=imR02mafdIiX5FufQTpYA4OXy5s%3D';

// Elemento canvas onde o PDF será renderizado
const canvas = document.querySelector('.pdf-canvas');
const ctx = canvas.getContext('2d');

// Carrega o PDF
pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
    // Pega a primeira página do PDF
    return pdf.getPage(1);
}).then(function(page) {
    // Define a escala de visualização (ajuste conforme necessário)
    const viewport = page.getViewport({ scale: 1.5 });

    // Ajusta o tamanho do canvas para o tamanho da página
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Renderiza a página do PDF no canvas
    page.render({
        canvasContext: ctx,
        viewport: viewport
    });
}).catch(function(error) {
    console.error('Erro ao carregar o PDF:', error);
});
