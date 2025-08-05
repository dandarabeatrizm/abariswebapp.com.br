// Configuração do PDF.js (define o caminho para os workers)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// URL do PDF que você quer carregar
const pdfUrl = 'https://exemplo.com/seu-arquivo.pdf';

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
