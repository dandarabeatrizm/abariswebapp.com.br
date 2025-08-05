import * as template from 'viewer.html';
import '../../utils/natives';
import { fabric } from 'fabric';
import * as PDFJS from 'pdfjs-dist/build/pdf';
import { jsPDF } from "jspdf"
import { Translate } from '../../services/translate-service';
import * as toastr from 'toastr';
import { IDocumentModel, IDocumentMarkupModel, IViewerOptions, IViewerResult, ICertificateInfo, IDocumentSectionModel, SignatureSubscribersModel, ISubscriberRectConfig } from './viewer.model';
import { AccreditationTypeEnum, AnnotationTypeEnum, PdfViewMode, SectionTypeEnum } from './viewer.enum';
import { Utils } from '../../utils/utils';
import { ColorGenerator } from '../../utils/color-generator';

PDFJS.GlobalWorkerOptions.workerSrc = Utils.getCdnUrlScript() + '/lib/pdfjs/pdf.worker.js';

const defaultScale = 1.31;

/**
 * Viewer PDF
 *
 * @export
 * @class ViewerPdf
 */
export class ViewerPdf {

	/////////////////////////////////////////////////////
	//#region Properties
	/////////////////////////////////////////////////////

	/**
	 * Instância do PDFJS
	 *
	 * @memberof ViewerPdf
	 */
	public PDFJSViewer = PDFJS;

	/**
	 * Número de páginas totais
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public numberOfPages: number = 0;

	/**
	 * Número de páginas carregadas
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public pagesRendered: number = 0;

	/**
	 * Objetos das Annotations
	 *
	 * @type {Array<any>}
	 * @memberof ViewerPdf
	 */
	public fabricObjects: Array<any> = [];

	/**
	 * Canvas ativo para annotation
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public activeCanvas: number = 0;

	/**
	 * Url do documento
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public url: string;

	/**
	 * Scala inicial
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public scale: number = defaultScale;

	/**
	 * Objeto do PDF carregado na inicialização
	 *
	 * @memberof ViewerPdf
	 */
	public pdfObj = null;

	/**
	 * Objeto utilizado para popular a lista de arquivos
	 *
	 * @type {*}
	 * @memberof ViewerPdf
	 */
	public objFileList: any;

	/**
	 * Objeto do doc carregado
	 *
	 * @type {Array<IDocumentMarkupModel>}
	 * @memberof ViewerPdf
	 */
	public docInfo: Array<IDocumentMarkupModel> = [];

	/**
	 * Nome do doc carregado
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public docName: string;

	/**
	 * Índice do doc carregado
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public docIndex: number;

	/**
	 * Array para store dos objetos já marcados no doc
	 *
	 * @type {*}
	 * @memberof ViewerPdf
	 */
	public storageObj: any = null;

	/**
	 * Iamgem em base 64 com a assinatura
	 *
	 * @type {*}
	 * @memberof ViewerPdf
	 */
	public base64: any = null;
	
	/**
	 * Imagem em base 64 com a rubrica
	 *
	 * @type {*}
	 * @memberof ViewerPdf
	 */
	 public base64Rubric: any = null;

	/**
	 * Font utilizada para criar a assinatura
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public fontSignName: string;


	/**
	 * Tamanho da font utilizada prar criar assinatura
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	public fontSignSize: number;

	/**
	 * Nome inputado na moda de escolha da assinatura
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	 public nameValSign: string = '';

	/**
	 * Font utilizada para criar a rubrica
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	 public fontRubricName: string;

	/**
	 * Tamanho da font utilizada prar criar rubrica
	 *
	 * @type {number}
	 * @memberof ViewerPdf
	 */
	 public fontRubricSize: number;

	/**
	 * Nome inputado na moda de escolha da assinatura
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	 public nameValRubric: string = '';

	/**
	 * Permitir navegar entre assinaturas
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public marksFilterSignatures: boolean = true;

	/**
	 * Permitir navegar entre rubricas
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public marksFilterRubrics: boolean = true;

	/**
	 * Marcar se doc foi assinado
	 *
	 * @type {boolean}
	 * @memberof ViewerPdf
	 */
	public isDocSign: boolean = false;

	/**
	 * Opções para o viewer
	 *
	 * @type {IViewerOptions}
	 * @memberof ViewerPdf
	 */
	public options: IViewerOptions;

	/**
	 * Certificate info
	 *
	 * @type {ICertificateInfo}
	 * @memberof ViewerPdf
	 */
	public objSelectedCert: ICertificateInfo;

	/**
	 * Translate i18n service
	 *
	 * @private
	 * @type {Translate}
	 * @memberof ViewerPdf
	 */
	private objTranslate: Translate;

	/**
	 * MArcação atual navegada pelos botões de "Ir para marcação"
	 *
	 * @type {any}
	 * @memberof ViewerPdf
	 */
	public currentMarkFocus: any;

	//#endregion

	/////////////////////////////////////////////////////
	//#region Getters and Setters
	/////////////////////////////////////////////////////

	/**
	 * Container onde pdf será renderizado
	 *
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public get containerId(): string {
		return this.options.containerId;
	}

	/**
	 * Modo de visualização
	 *
	 * @readonly
	 * @type {PdfViewMode}
	 * @memberof ViewerPdf
	 */
	public get viewMode(): number {
		return this.options.viewMode && typeof (this.options.viewMode) === 'number' ? this.options.viewMode : PdfViewMode.viewDocuments;
	}

	/**
	 * Função de retorno
	 *
	 * @readonly
	 * @type {*}
	 * @memberof ViewerPdf
	 */
	public get callback(): any {
		if (typeof this.options.callback !== "function") {
			$('.loading').css('display', 'none');
			throw new Error(this.translate('callbackMustBeFunction'));
		}
		return this.options.callback;
	}

	/**
	 * Lista de documentos PDF
	 *
	 * @readonly
	 * @type {Array<IDocumentModel>}
	 * @memberof ViewerPdf
	 */
	public get fileList(): Array<IDocumentModel> {
		return this.options.fileList;
	}


	/**
	 * Objeto para associar as assinaturas
	 *
	 * @readonly
	 * @type {Array<IDocumentMarkupModel>}
	 * @memberof ViewerPdf
	 */
	public get objBind(): Array<IDocumentMarkupModel> {
		return this.options.objBind;
	}

	/**
	 * Nome do assinador
	 *
	 * @readonly
	 * @type {string}
	 * @memberof ViewerPdf
	 */
	public get subscriberName(): string {
		return this.options.subscriberName ? this.options.subscriberName : "";
	}

	/**
	 * Lista de assinantes
	 *
	 * @readonly
	 * @type {Array<SignatureSubscribersModel>}
	 * @memberof ViewerPdf
	 */
	public get subscribersList(): Array<SignatureSubscribersModel> {
		return this.options.subscribersList;
	}

	/**
	 * É assinatura digital
	 *
	 * @readonly
	 * @type {boolean}
	 * @memberof ViewerPdf
	 */
	public get IsEletronicSign(): boolean {
		return (this.options.accreditationType === AccreditationTypeEnum.Electronics);
	}

	/**
	 * Possui certificado
	 *
	 * @readonly
	 * @type {boolean}
	 * @memberof ViewerPdf
	 */
	public get HasCertificates(): boolean {
		return (!this.IsEletronicSign && this.options.certificates && this.options.certificates.length > 0);
	}


	public get DownloadVisibility(): boolean {
		return this.options.downloadButton !== undefined || this.options.downloadButton !== null ? this.options.downloadButton : true;
	}

	//#endregion

	/////////////////////////////////////////////////////
	//#region Initialize
	/////////////////////////////////////////////////////

	/**
	 * Creates an instance of ViewerPdf.
	 * @param {IViewerOptions} options Opções do viewer pdf
	 * @memberof ViewerPdf
	 */
	constructor(options: IViewerOptions) {
		this.options = options;
		this.initTranslate(options.culture);
		this.objFileList = this.fileList;
		if (this.fileList.length == 0) {
			throw new Error(this.translate('notDocSent'));
		}
		if (this.objBind && this.objBind.length > 0) {
			this.signObject(JSON.stringify(this.objBind));
		} else {
			this.signObject("");
		}
		this.docName = this.fileList[0].fileName;
		this.initToastr();
		this.renderContainerToolbar();
		this.renderMenuDocs(this.objFileList);
		this.renderSubscribersList(this.subscribersList);
		this.loadDocument(this.fileList[0].tempPath, this.docName, 0);
		this.initButtonsSignatureNavigate();

		this.initSubscribersButtons();
	}

	//#endregion

	/////////////////////////////////////////////////////
	//#region Private methods
	/////////////////////////////////////////////////////

	/**
 * Inicia o componente Toastr (Balão de informação)
 *
 * @private
 * @memberof ViewerPdf
 */
	private initButtonsSignatureNavigate(): void {
		const that = this;

		if (this.viewMode === PdfViewMode.signDocuments) {
			if(this.marksFilterSignatures) {
				$('#marksFilterSignatures').attr('checked', 'checked');
			}
			if(this.marksFilterRubrics) {
				$('#marksFilterRubrics').attr('checked', 'checked');
			}

			$('#marksFilterSignatures').on('change', () => {
				that.marksFilterSignatures = !that.marksFilterSignatures;
				that.currentMarkFocus = undefined;
			});
			$('#marksFilterRubrics').on('change', () => {
				that.marksFilterRubrics = !that.marksFilterRubrics;
				that.currentMarkFocus = undefined;
			});

			$("#btnPrevSignature").on('click', function () {
				that.goToPrevSignature();
			});
			$("#btnNextSignature").on('click', function () {
				that.goToNextSignature();
			});
		}

	}

	/**
	 * Inicia o componente Toastr (Balão de informação)
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private initToastr(): void {
		toastr.options.closeButton = true;
		toastr.options.debug = false;
		toastr.options.newestOnTop = false;
		toastr.options.progressBar = true;
		toastr.options.positionClass = "toast-top-right";
		toastr.options.preventDuplicates = true;
		toastr.options.onclick = null;
		toastr.options.showDuration = 300;
		toastr.options.hideDuration = 1000;
		toastr.options.timeOut = 5000;
		toastr.options.extendedTimeOut = 1000;
		toastr.options.showEasing = "swing";
		toastr.options.hideEasing = "linear";
	}

	/**
	 * Inicializa o serviço de tradução
	 *
	 * @private
	 * @param {string} lang
	 * @memberof ViewerPdf
	 */
	private initTranslate(lang: string): void {
		this.objTranslate = Translate.getInstance();
		this.objTranslate.Lang = lang;
	}

	/**
	 * Inicializa as ações dos botoes de tipo de assinatura dos subscribers
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private initSubscribersButtons() {
		const that = this;
		$('#bt-subscribersSignature').click(function () {
			that.showSubscribersListSignature();
		});
		$('#bt-subscribersRubric').click(function () {
			that.showSubscribersListRubric();
		});
	}

	/**
	 * Realiza a tradução
	 *
	 * @private
	 * @param {string} key Chava para tradução
	 * @returns {string} Texto traduzido
	 * @memberof ViewerPdf
	 */
	private translate(key: string): string {
		return this.objTranslate.translate(key);
	}

	/**
	 * Tradução da view
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private translateView(): void {
		$('#page').html(this.translate('page'));
		$('#of').html(this.translate('of'));
		$('#close').html(this.translate('close'));
		$('#save').html(this.translate('save'));
		$('#signatureLocation').html(this.translate('signatureLocation'));
		$('#chooseYourSignature').html(this.translate('chooseYourSignature'));
		$('#whatNameSignature').html(this.translate('whatNameSignature'));
		$('#generateSignature').html(this.translate('generateSignature'));
		$('#chooseSignatureUsed').html(this.translate('chooseSignatureUsed'));
		$('#clickUsedSignature').html(this.translate('clickUsedSignature'));
		$('#chooseYourCertificate').html(this.translate('chooseYourCertificate'));
		$('#whatNameRubric').html(this.translate('whatNameRubric'));
		$('#generateRubric').html(this.translate('generateRubric'));
		$('#chooseRubricUsed').html(this.translate('chooseRubricUsed'));
		$('#clickUsedRubric').html(this.translate('clickUsedRubric'));
		$('#btnPrevSignature').attr('title', this.translate('previousAppointment'));
		$('#btnNextSignature').attr('title', this.translate('nextAppointment'));
		$('#btnPrevSignature').html(this.translate('previous'));
		$('#btnNextSignature').html(this.translate('next'));
		$('#bt-subscribersSignature').html(this.translate('signature'));
		$('#bt-subscribersRubric').html(this.translate('rubric'));
		$('#labelMarksFilterSignatures').append(this.translate('signature'));
		$('#labelMarksFilterRubrics').append(this.translate('rubric'));
		$('#progressText span:eq(0)').text(this.translate('wereCompleted'));
		$('#progressText span:eq(2)').text(this.translate('of'));
		$('#progressText span:eq(4)').text(this.translate('signatures'));
		$('.translatable-button').each((index, element) => {
			const translateKey = $(element).data('translate-key');
			$(element).attr('title', this.translate(translateKey));
		});
	}

	/**
	 * Carrega html e faz append no container escolhido
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private renderContainerToolbar(): void {
		let html: string = template;
		let strHtml: String = html.interpolate({ idContainer: this.containerId, subscriberName: this.subscriberName });
		$("#" + this.containerId).append(strHtml.toString());
		this.handleToolsToolbar();
	}

	/**
	 * Renderiza o Menu de docs
	 *
	 * @private
	 * @param {IDocumentModel[]} fileList Lista de documentos
	 * @memberof ViewerPdf
	 */
	private renderMenuDocs(fileList: IDocumentModel[]): void {
		let that = this;
		$.each(fileList, function (index, item) {
			let nome: string = item.fileName;
			let tempPath = item.tempPath;
			let isActive = index == 0 ? "active" : "";
			let template = `<a class="menu--icon menu__content btListDoc ${isActive}" title="${nome}" data-path="${tempPath}">
								<i class="glyph ab-doc"></i>
								<p class="menu__p">${nome}</p>
							</a>`;
			$("#" + that.containerId).find(".menu__document").append(template);
		});
		this.handleClickBtListDoc();
	}

	/**
	 * Ação de click da lista de docs
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private handleClickBtListDoc(): void {
		let that = this;
		$("#" + this.containerId).find(".menu__document a").click(function () {
			$("#" + that.containerId).find(".menu__document a").removeClass("active");
			let linkValue = $(this).data("path");
			that.loadDocument(linkValue, $(this).attr("title"), $(this).index());
			$("#" + that.containerId).find(".menu__document a").removeClass("active");
			$(this).addClass("active");
		});

		$("#" + this.containerId + " .menu__document a:first").addClass("active");
	}

	/**
	 * Renderiza a lista de assinantes (colocar createSignRect)
	 *
	 * @private
	 * @param {SignatureSubscribersModel[]} subscribersList Lista de assinantes
	 * @memberof ViewerPdf
	 */
	private async renderSubscribersList(subscribersList: SignatureSubscribersModel[]): Promise<void> {
		let that = this;
		const colorsIgnore = ['#ffffff', '#c2c3c8', '#000000'];
		const colorGenerator = new ColorGenerator(colorsIgnore);

		const selectColorsArray = [];
		$.each(subscribersList, function (index, item) {
			const { id, name, email } = item;

			const color = colorGenerator.generateRandomColor();
			selectColorsArray.push(color);

			let templateSignature = `
				<a class="menu--icon menu__content randomColors btListDoc subscribers__list_signature" id="subscribers__signature__list__item__${id}" title="${name} - ${email} - ${that.translate('signatureNotChecked')}" >
					<span id="subscribers__signature__list__item__${id}__icon__" >
						<i class="glyph ab-sign"></i>
					</span>
					<p class="menu__p">${name}</p>
				</a>
			`;
			$("#" + that.containerId).find(".subscribers__list").append(templateSignature);

			const itemListHtmlSignature = $("#" + that.containerId).find(`a[id='subscribers__signature__list__item__${id}']`);

			that.defineColor(itemListHtmlSignature, color);

			itemListHtmlSignature.click(function () {
				let certificadoJaColocado = false;

				that.storageObj = sessionStorage.getItem("ObjSign");

				if (that.storageObj) {
					JSON.parse(that.storageObj).forEach((val, i) => {
						if (that.docIndex == i) {
							let section = val.section;
							if (section && section.length > 0) {
								section.forEach((item, index) => {
									if(!that.IsEletronicSign && !item?.isRubric && item.idSubscriber === id){
										certificadoJaColocado = true;
									}
								});
							}
						}
					});
				}

				if (!certificadoJaColocado) {
					const subscribeRectConfig: ISubscriberRectConfig = { idSubscriber: id, name, color, isRubric: false };
					that.createRect(null, true, subscribeRectConfig);
				} else {
					toastr.warning(that.translate('certificateLimitReached'));
				}

				itemListHtmlSignature.css("pointer-events", "none");
				setTimeout(() => {
					itemListHtmlSignature.css("pointer-events", "auto");
				}, 300);
			});

			let templateRubric = `
				<a class="menu--icon menu__content randomColors btListDoc subscribers__list_rubric" id="subscribers__rubric__list__item__${id}" title="${name} - ${email} - ${that.translate('rubricNotChecked')}" >
					<span id="subscribers__rubric__list__item__${id}__icon__" >
						<i class="glyph ab-sign"></i>
					</span>
					<p class="menu__p">${name}</p>
				</a>
			`;
			$("#" + that.containerId).find(".subscribers__list").append(templateRubric);

			const itemListHtmlRubric = $("#" + that.containerId).find(`a[id='subscribers__rubric__list__item__${id}']`);

			that.defineColor(itemListHtmlRubric, color);

			itemListHtmlRubric.click(function () {
				const subscribeRectConfig: ISubscriberRectConfig = { idSubscriber: id, name, color, isRubric: true };
				that.createRect(null, true, subscribeRectConfig);
			});

		});

		this.showSubscribersListSignature(); // para mostrar primeiro a lista de assinaturas
	}

	/**
	 * Verificar assinaturas marcadas na lista de assinantes
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private verifySectionsUpdateSubscribersListStatus() {
		if (this.viewMode !== PdfViewMode.markDocuments || !this.docInfo) {
			return null;
		}

		this.subscribersList.forEach(subscriber => {
			const haveSignature = this.docInfo[this.docIndex]?.section.filter(section =>
				!section.isRubric && subscriber.id === section.idSubscriber
			).length > 0;
			const haveRubric = this.docInfo[this.docIndex]?.section.filter(section =>
				section.isRubric && subscriber.id === section.idSubscriber
			).length > 0;

			const subscriberListHtmlSignature = $("#" + this.containerId).find(".subscribers__list");
			const subscriberIconHtmlSignature = subscriberListHtmlSignature.find(`span[id='subscribers__signature__list__item__${subscriber.id}__icon__']`);

			if(haveSignature){
				// definir title como Assinado e definir icone com check
				subscriberListHtmlSignature.find(`a[id='subscribers__signature__list__item__${subscriber.id}']`).attr('title', `${subscriber.name} - ${subscriber.email} - ${this.translate('signatureAlreadyChecked')}`);
				subscriberIconHtmlSignature.html('<i class="glyph ab-confirm"></i>');
			} else {
				// definir title como Não assinado e definir icone com padrão
				subscriberListHtmlSignature.find(`a[id='subscribers__signature__list__item__${subscriber.id}']`).attr('title', `${subscriber.name} - ${subscriber.email} - ${this.translate('signatureNotChecked')}`);
				subscriberIconHtmlSignature.html('<i class="glyph ab-sign"></i>');
			}
			
			const subscriberListHtmlRubric = $("#" + this.containerId).find(".subscribers__list");
			const subscriberIconHtmlRubric = subscriberListHtmlRubric.find(`span[id='subscribers__rubric__list__item__${subscriber.id}__icon__']`);

			if (haveRubric) {
				// definir title como Assinado e definir icone com check
				subscriberListHtmlRubric.find(`a[id='subscribers__rubric__list__item__${subscriber.id}']`).attr('title', `${subscriber.name} - ${subscriber.email} - ${this.translate('rubricAlreadyChecked')}`);
				subscriberIconHtmlRubric.html('<i class="glyph ab-confirm"></i>');
			} else {
				// definir title como Não assinado e definir icone com padrão
				subscriberListHtmlRubric.find(`a[id='subscribers__rubric__list__item__${subscriber.id}']`).attr('title', `${subscriber.name} - ${subscriber.email} - ${this.translate('rubricNotChecked')}`);
				subscriberIconHtmlRubric.html('<i class="glyph ab-sign"></i>');
			}

		})
	}

	/**
	 * Mostrar lista de assinates para assinatura
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private showSubscribersListSignature() {
		$('#bt-subscribersSignature').prop('disabled', true);
		$('#bt-subscribersRubric').prop('disabled', false);

		$(".subscribers__list_signature").show();
		$(".subscribers__list_rubric").hide();
	}
	/**
	 * Mostrar lista de assinates para rubrica
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private showSubscribersListRubric() {
		$('#bt-subscribersSignature').prop('disabled', false);
		$('#bt-subscribersRubric').prop('disabled', true);


		$(".subscribers__list_signature").hide();
		$(".subscribers__list_rubric").show();
	}

	/**
	 * Ação de gerar cores aleatórias para cada assinante
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private defineColor(html: any, color) {
		html.attr('data-color', color);
		html.css('border-left-color', color);

		$('.randomColors').mouseover(function () {
			$(this).css('background-color', $(this).attr('data-color'));
		});
		$('.randomColors').mouseout(function () {
			$(this).css('background-color', 'transparent');
		});
	}

	/**
	 * Exibição dos botões para assinatura
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private handleDisplayButtons(): void {
		if (this.viewMode === PdfViewMode.viewDocuments || this.viewMode === PdfViewMode.signDocuments) {
			$("#" + this.containerId).find(".signButtons").remove();
		}
		if (this.viewMode === PdfViewMode.signDocuments || this.viewMode === PdfViewMode.markDocuments) {
			$("#" + this.containerId).find(".printDoc").remove();
		}

		if (this.viewMode === PdfViewMode.markDocuments) {
			$("#" + this.containerId).find(".fullscreenButtons").remove();
		}

		if (!this.DownloadVisibility) {

			$("#" + this.containerId).find(".downloadDoc").remove();
		}

		if (this.viewMode !== PdfViewMode.signDocuments) {
			$(".toolbar-previous-next").remove();
			$("#callOutDocs").remove();
			$(".toolbar-sign-progress").remove();
		}
	}

	/**
	 * Atacha eventos do botões da toolbar
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private handleToolsToolbar(): void {
		let that = this;
		this.handleDisplayButtons();
		$("#" + this.containerId).find(".zoomIn").click(function () {
			that.zoomDoc('in');
		});
		$("#" + this.containerId).find(".zoomOut").click(function () {
			that.zoomDoc('out');
		});
		let timeout = null;
		// $("#" + this.containerId).find(".printDoc").click(function () {
		// 	$('.loading').css('display', 'block');
		// 	clearTimeout(timeout);
		// 	timeout = setTimeout(function () {
		// 		that.printDoc(that.url);
		// 	}, 1000);
		// 	$('.loading').css('display', 'none');
		// });
		$("#" + this.containerId).find(".downloadDoc").click(function () {
			that.download(that.url, that.docName);
		});
		$("#" + this.containerId).find(".deleteSelected").click(function () {
			that.deleteSelectedObject();
		});
		$("#" + this.containerId).find(".clearActivePage").click(function () {
			that.clearActivePage();
		});
		$("#" + this.containerId).find(".serialize").click(function () {
			that.serializePdf();
		});
		$("#" + this.containerId).find(".pageUp").click(function () {
			if (that.numberOfPages > 1) {
				const pageNum = Number($(".inputPageChange").val().toString()) - 1;
				if (pageNum >= 1) {
					$(".inputPageChange").val(pageNum);
					$(".inputPageChange").trigger("keyup");
				}
			}
		});
		$("#" + this.containerId).find(".pageDown").click(function () {
			if (that.numberOfPages > 1) {
				const pageNum = Number($(".inputPageChange").val().toString()) + 1;
				if (pageNum <= that.numberOfPages) {
					$(".inputPageChange").val(pageNum);
					$(".inputPageChange").trigger("keyup");
				}
			}
		});
		var timer = null;
		$("#" + this.containerId).find(".inputPageChange").keyup(function () {
			let inst = this;
			let val: any = $(this).val().toString();
			clearTimeout(timer);
			timer = setTimeout(function () {
				that.gotoPage(Number(val) - 1);
			}, 500);
		});
		if (this.viewMode !== PdfViewMode.viewDocuments) {
			window.onbeforeunload = this.setBeforeUnload;
		}
		$("#" + this.containerId).find(".pdf-container").on("scroll", function () {
			if (that.numberOfPages > 1) {
				let scrollTop = $(this).scrollTop();
				$("#" + that.containerId).find(".canvas-container").each(function (index, el) {
					let height = ($(this).height() / 2) * -1;
					if ($(this).position().top < height) {
						if (that.numberOfPages > ($(this).index() + 1)) {
							that.activeCanvas = $(this).index() + 1;
							$(".inputPageChange").val($(this).index() + 2);
						}
					}
				});
				let heightfirstPage = ($("#" + that.containerId).find(".canvas-container:eq(0)").height() / 2)
				if ($(this).scrollTop() < heightfirstPage) {
					that.activeCanvas = 0;
					$(".inputPageChange").val(1);
				}
			} else {
				that.activeCanvas = 0;
			}

		});

		$("#" + this.containerId).find(".bt-fullscreen").click(function () {
			$("#" + that.containerId).closest(".panel-body").addClass("fullscreen");
			$(this).hide();
			$("#" + that.containerId).find(".bt-fullscreenOff").show();
		});

		$("#" + this.containerId).find(".bt-fullscreenOff").click(function () {
			$("#" + that.containerId).closest(".panel-body").removeClass("fullscreen");
			$(this).hide();
			$("#" + that.containerId).find(".bt-fullscreen").show();
		});

		this.translateView();
	}

	/**
	 * Salvar modal com a assinatura escolhida
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private handleClickModalSign(): void {
		let that = this;
		let fabricObj = this.fabricObjects[that.activeCanvas];
		let scaleObject = this.scale;

		$("#" + this.containerId + "ModalViewer").find(".BtModalSalvarSign").unbind("click").click(function () {
			let w = (!that.IsEletronicSign ? 266 * scaleObject : 225 * scaleObject);
			let h = (!that.IsEletronicSign ? 86 * scaleObject : 30 * scaleObject);

			var activeObject = that.fabricObjects[that.activeCanvas].getActiveObject();
			if (activeObject && (that.fontSignName || !that.IsEletronicSign)) {
				that.fabricObjects[that.activeCanvas].remove(activeObject);
				let left = activeObject.oCoords.bl.x + 20;
				let bottom = activeObject.oCoords.bl.y;

				let originY = !that.IsEletronicSign ? 'top' : 'bottom';
				let fontSize = !that.IsEletronicSign ? 10 * scaleObject : that.fontSignSize * scaleObject;
				let fontFamily = !that.IsEletronicSign ? 'Arial' : that.fontSignName;
				let textVal = !that.IsEletronicSign ? that.getCertInfoNormalize() : that.nameValSign;
				var textSign = new fabric.Text(textVal, {
					fontSize: fontSize,
					fontFamily: fontFamily,
					fontWeight: 'normal',
					originX: 'left',
					originY: originY,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.signDocuments ? true : false,
					lockMovementY: that.viewMode === PdfViewMode.signDocuments ? true : false,
					selectable: false,
					hasControls: false,
					top: !that.IsEletronicSign ? - 8 : 5,
					left: !that.IsEletronicSign ? 0 : (20 * scaleObject),
					data: activeObject.data, // Index to burn the image
					hoverCursor: "default"
				});

				let rect = new fabric.Rect({
					width: w,
					height: h,
					fill: "rgba(0, 152, 154, 0)",
					stroke: "rgba(0, 152, 154, 0)",
					top: 0,
					left: 0
				});

				let group = new fabric.Group([rect, textSign], {
					left: (!that.IsEletronicSign ? left - (18 * scaleObject) : left - (20 * scaleObject)),
					top: ((!that.IsEletronicSign ? bottom - (86.2 * scaleObject) : bottom - (30 * scaleObject))),
					// top: (!that.IsEletronicSign ? bottom - 112 : bottom - 35)
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.markDocuments ? false : true,
					lockMovementY: that.viewMode === PdfViewMode.markDocuments ? false : true,
					hasControls: false,
					data: activeObject.data
				});
				
				const classDivDeleteRect = activeObject.data.isRubric ? 'closeRubric' : 'closeSign';
				$(that.fabricObjects[that.activeCanvas].lowerCanvasEl).closest(".canvas-container").append("<div class='" + classDivDeleteRect + "' data-indice='" + (activeObject.data ? activeObject.data : 0) + "' style='position:absolute; top: " + ((!that.IsEletronicSign ? bottom - (60 * that.scale) : bottom) - (23 * that.scale)) + "px; left: " + (!that.IsEletronicSign ? left - (45 * that.scale) : left - (25 * that.scale)) + "px; font-size: " + (16 * scaleObject) + "px'><i class='glyph ab-delete'></i></div>");
				that.handleClickEditSign();
				var textSignNotScale = new fabric.Text(textVal, {
					fontSize: !that.IsEletronicSign ? 10 : that.fontSignSize,
					fontFamily: fontFamily,
					fontWeight: 'normal',
					originX: 'left',
					originY: originY,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.signDocuments ? true : false,
					lockMovementY: that.viewMode === PdfViewMode.signDocuments ? true : false,
					selectable: false,
					hasControls: false,
					top: !that.IsEletronicSign ? - 8 : 5,
					left: 0,
					data: activeObject.data, // Index to burn the image
					hoverCursor: "default"
				});
				fabricObj.add(group);
				let str64 = textSignNotScale.toDataURL({ format: 'png', multiplier: 3 });
				that.base64 = str64.replace("data:image/png;base64,", "");
				let serialize = that.serializePdf.bind(that)(activeObject.data.index);

				const objResult = {
					pdfDocument: that.pdfObj,
					docInfoSerialize: serialize,
					base64Sign: that.base64,
					base64Rubric: that.base64Rubric,
					selectedCertificate: that.objSelectedCert
				} as IViewerResult;

				that.callback(objResult);
				that.signObject(serialize);
				$("#" + that.containerId + "ModalViewer").modal("hide");
			} else {
				toastr.warning(that.translate('chooseSignature'));
			}

		});
	}
	/**
	 * Salvar modal com a rubrica escolhida
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private handleClickModalRubric(): void {
		let that = this;
		let fabricObj = this.fabricObjects[that.activeCanvas];
		let scaleObject = this.scale;

		$("#" + this.containerId + "ModalViewerRubric").find(".BtModalSalvarRubric").unbind("click").click(function () {
			let w = 225 * scaleObject;
			let h = 30 * scaleObject;

			var activeObject = that.fabricObjects[that.activeCanvas].getActiveObject();
			if (activeObject && that.fontRubricName) {
				that.fabricObjects[that.activeCanvas].remove(activeObject);
				let left = activeObject.oCoords.bl.x + 20;
				let bottom = activeObject.oCoords.bl.y;

				let originY = 'bottom';
				let fontSize = that.fontRubricSize * scaleObject;
				let fontFamily = that.fontRubricName;
				let textVal = that.nameValRubric;
				var textRubric = new fabric.Text(textVal, {
					fontSize: fontSize,
					fontFamily: fontFamily,
					fontWeight: 'normal',
					originX: 'left',
					originY: originY,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.signDocuments ? true : false,
					lockMovementY: that.viewMode === PdfViewMode.signDocuments ? true : false,
					selectable: false,
					hasControls: false,
					top: 5,
					left: (20 * scaleObject),
					data: activeObject.data, // Index to burn the image
					hoverCursor: "default"
				});

				let rect = new fabric.Rect({
					width: w,
					height: h,
					fill: "rgba(0, 152, 154, 0)",
					stroke: "rgba(0, 152, 154, 0)",
					top: 0,
					left: 0
				});

				let group = new fabric.Group([rect, textRubric], {
					left: left - (20 * scaleObject),
					top: bottom - (30 * scaleObject),
					// top: bottom - 35
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.markDocuments ? false : true,
					lockMovementY: that.viewMode === PdfViewMode.markDocuments ? false : true,
					hasControls: false,
					data: activeObject.data
				});
				
				$(that.fabricObjects[that.activeCanvas].lowerCanvasEl).closest(".canvas-container").append("<div class='closeRubric' data-indice='" + (activeObject.data ? activeObject.data : 0) + "' style='position:absolute; top: " + (bottom - (23 * that.scale)) + "px; left: " + (left - (25 * that.scale)) + "px; font-size: " + (16 * scaleObject) + "px'><i class='glyph ab-delete'></i></div>");
				that.handleClickEditRubric();
				var textRubricNotScale = new fabric.Text(textVal, {
					fontSize: fontSize,
					fontFamily: fontFamily,
					fontWeight: 'normal',
					originX: 'left',
					originY: originY,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.signDocuments ? true : false,
					lockMovementY: that.viewMode === PdfViewMode.signDocuments ? true : false,
					selectable: false,
					hasControls: false,
					top: 5,
					left: (20 * scaleObject),
					data: activeObject.data, // Index to burn the image
					hoverCursor: "default"
				});
				fabricObj.add(group);
				let str64 = textRubricNotScale.toDataURL({ format: 'png', multiplier: 3 });
				that.base64Rubric = str64.replace("data:image/png;base64,", "");
				
				let serialize = that.serializePdf.bind(that)(activeObject.data.index);

				const objResult = {
					pdfDocument: that.pdfObj,
					docInfoSerialize: serialize,
					base64Sign: that.base64,
					base64Rubric: that.base64Rubric,
					selectedCertificate: that.objSelectedCert
				} as IViewerResult;

				that.callback(objResult);
				that.signObject(serialize);
				$("#" + that.containerId + "ModalViewerRubric").modal("hide");
			} else {
				toastr.warning(that.translate('chooseRubric'));
			}

		});
	}

	private handleClickEditSign(): void {
		let that = this;
		$(".closeSign").unbind("click").click(function () {
			that.base64 = null;
			let indice = $(this).data("indice");

			that.removeAllSignatures();

			that.docInfo[that.docIndex].isDocSign = that.getDocsSign();

			that.signObject(JSON.stringify(that.docInfo));
			let pageNum = $(".inputPageChange").val().toString();
			that.loadPages(that.pdfObj, true, function () {
				that.gotoPage(Number(pageNum) - 1);
			});
		});
	}

	private removeAllSignatures() {
		for(var i = 0; i < this.docInfo[this.docIndex].section.length; i++) {
			if(!this.docInfo[this.docIndex].section[i].isRubric) {
				this.docInfo[this.docIndex].section[i] = this.objBind[this.docIndex].section[i];
			}
		}
	}

	private handleClickEditRubric(): void {
		let that = this;
		$(".closeRubric").unbind("click").click(function () {
			that.base64Rubric = null;
			let indice = $(this).data("indice");
			
			that.removeAllRubrics();

			that.signObject(JSON.stringify(that.docInfo));
			let pageNum = $(".inputPageChange").val().toString();
			that.loadPages(that.pdfObj, true, function () {
				that.gotoPage(Number(pageNum) - 1);
			});
		});
	}

	private removeAllRubrics () {
		for(var i = 0; i < this.docInfo[this.docIndex].section.length; i++) {
			if(this.docInfo[this.docIndex].section[i].isRubric) {
				this.docInfo[this.docIndex].section[i] = this.objBind[this.docIndex].section[i];
			}
		}
	}

	/**
	 * Carrega as páginas na inicialização
	 *
	 * @private
	 * @param {*} pdf Documento PDF
	 * @returns {Promise<void>}
	 * @memberof ViewerPdf
	 */
	private async loadPages(pdf: any, isZoom: boolean, callback?: any): Promise<void> {
		let that = this;
		$("#" + that.containerId).find(".pdf-container").empty();
		that.pagesRendered = 0;
		let pageViewport = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		const pdfContainerWidth = document.querySelectorAll("#" + that.containerId + " .pdf-container")[0].clientWidth;
		
		for (let i = 1; i <= pdf._pdfInfo.numPages; i++) {
			await pdf.getPage(i).then(function (page: any) {
				
				let viewport;
				let scale = 0.5;
				
				if (pageViewport <= 1024 && !isZoom) {
					viewport = page.getViewport({ scale: scale });
					that.scale = scale;
				} else {
					viewport = page.getViewport({ scale: that.scale });
				}

				let canvas = document.createElement('canvas');
				$("#" + that.containerId).find(".pdf-container").append(canvas);
				canvas.className = 'pdf-canvas';
				canvas.height = viewport.height;
				canvas.width = viewport.width;
				let context = canvas.getContext('2d');

				let renderContext = {
					canvasContext: context,
					viewport: viewport
				};

				

				let renderTask = page.render(renderContext);
				renderTask.promise.then(function () {
					

					that.pagesRendered++;
					
					if (that.pagesRendered == that.numberOfPages) {

						if (pageViewport <= 1024 && !isZoom){
							that.scale = scale;
						}

						$("#" + that.containerId + " .pdf-canvas").each(function (index, el) {
							$(el).attr('id', 'page-' + (index + 1) + '-canvas-' + that.containerId);
							$(el).attr('href', '#page-' + (index + 1));
						});

						that.initFabric(callback);
						// canvas.width = 0;
						// canvas.height = 0;
						// canvas.remove();
						const objResult = {
							pdfDocument: that.pdfObj,
							docInfoSerialize: that.serializePdf.bind(that)(),
							base64Sign: that.base64,
							base64Rubric: that.base64Rubric,
							selectedCertificate: that.objSelectedCert
						} as IViewerResult;

						that.callback(objResult);


						$('.loading').css('display', 'none');
					}
				});
			});
		}
	}

	/**
	 * Cria os canvas do Fabric para trabalhar com as anotations após o load das páginas
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private initFabric(callback: any): void {
		let that = this;
		that.fabricObjects = [];
		$('#' + that.containerId + ' canvas').each(function (index: number, el: HTMLCanvasElement) {
			let background = el.toDataURL("image/png");
			//let fabricObj = [];
			let fabricObj: any = new fabric.Canvas(el.id, {
				selection: false,
				allowTouchScrolling: true
			});
			//(<any>fabricObj).freeDrawingBrush.width = 1;
			that.fabricObjects.push(fabricObj);
			fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
			$(fabricObj.upperCanvasEl).click(function (event) {
				that.activeCanvas = index;
				if (that.viewMode === PdfViewMode.viewDocuments) {
					const objResult = {
						pdfDocument: that.pdfObj,
						docInfoSerialize: that.serializePdf.bind(that)(),
						selectedPage: that.activeCanvas + 1
					} as IViewerResult;

					that.callback(objResult);
				}

				// confirm("Deseja selecionar a página \n" + (that.activeCanvas + 1) + ". \nA página selecionada será inserida no intervalo selecionado ou no último intervalo");
			});
		});

		that.handlerScroll();

		that.storageObj = sessionStorage.getItem("ObjSign");
		//if (that.viewMode !== PdfViewMode.viewDocuments) {
		if (that.storageObj) {
			JSON.parse(that.storageObj).forEach(function (val, i) {
				if (that.docIndex == i) {
					let section = val.section;
					if (section && section.length > 0) {
						section.forEach(function (item, index) {
							that.activeCanvas = item.pageNumber - 1;

							let subscribeRectConfig: ISubscriberRectConfig;

							if (that.viewMode === PdfViewMode.signDocuments) {
								subscribeRectConfig = {
									name: '',
									idSubscriber: item.idSubscriber,
									color: '#00989a',
									isRubric: item.isRubric
								};
							} else if (that.viewMode === PdfViewMode.markDocuments) {
								const itemListHtml = $("#" + that.containerId).find(`a[id='subscribers__signature__list__item__${item.idSubscriber}']`);
								
								const subscriber = that.subscribersList.find(subscriber => subscriber.id === item.idSubscriber);

								subscribeRectConfig = {
									name: subscriber.name,
									idSubscriber: item.idSubscriber,
									color: itemListHtml.data("color"),
									isRubric: item.isRubric
								};
							}

							that.createRect(item, false, subscribeRectConfig);
						});
					}
					that.activeCanvas = 0;
				}

			});
		}
		if (typeof (callback) === "function") {
			callback();
		}
		//}
	}

	/**
	 * Inicializa modal de escolha de assinatura com as exibições necessárias
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private initModalSign(): void {
		let that = this;
		if (this.base64 === null) {

			if (!that.IsEletronicSign) {
				$("#" + this.containerId + "ModalViewer").find(".button--ghost").show().css('margin', '0 auto');
			}
			$("#" + this.containerId + "ModalViewer").find(".BtModalSalvarSign").text(this.translate('save')).addClass('sign-digital');
			$("#" + this.containerId + "ModalViewer").find("form").show();
			$("#" + this.containerId + "ModalViewer").find(".canvas-clone-container").hide();

			$("#" + that.containerId + "ModalViewer").find(".radio-container").hide();
			if (this.IsEletronicSign)
				$("#" + that.containerId + "ModalViewer").find(".modal-footer").hide();

			$("#" + this.containerId + "ModalViewer").find(".BtSignGenerate").prop("disabled", true);

			$("#" + that.containerId + "ModalViewer").find(".InputSignName").unbind("keyup").on("keyup", function () {
				let val = $("#" + that.containerId + "ModalViewer").find(".InputSignName").val().toString().trim();
				if (val !== "") {
					$("#" + that.containerId + "ModalViewer").find(".BtSignGenerate").prop("disabled", false);
				} else {
					$("#" + that.containerId + "ModalViewer").find(".BtSignGenerate").prop("disabled", true);
				}
			});

			$("#" + that.containerId + "ModalViewer").find(".InputSignName").trigger("keyup");

			$("#" + this.containerId + "ModalViewer").find(".BtSignGenerate").unbind("click").click(function () {
				let val = $("#" + that.containerId + "ModalViewer").find(".InputSignName").val().toString();
				that.nameValSign = val;
				that.createSignChoseModal(that.nameValSign);
				$("#" + that.containerId + "ModalViewer").find(".radio-container").show();
				$("#" + that.containerId + "ModalViewer").find(".modal-footer").show();
			});
		} else {
			let radioChose = $('input[name=choseSign' + this.containerId + ']:checked').val();
			$("#" + this.containerId + "ModalViewer").find(".button--ghost").removeClass('sign-digital').show().removeAttr('style');
			$("#" + this.containerId + "ModalViewer").find(".BtModalSalvarSign").text("OK").removeClass('sign-digital').show();
			$("#" + this.containerId + "ModalViewer").find("form").hide();
			$("#" + this.containerId + "ModalViewer").find(".canvas-clone-container").show();
			$("#CanvasSignClone" + this.containerId).attr("id", "CanvasSign1" + this.containerId).text(this.nameValSign).css({ "font-size": this.fontSignSize + "px", "font-family": this.fontSignName });
			if (!that.IsEletronicSign) {
				let certInfo = this.getCertInfoNormalize()
				$(".canvas-clone").html(certInfo.replace(/\n/g, '<br />'));
			}
		}

		this.setAccreditationSignType();
	}

	/**
	 * Inicializa modal de escolha de rubrica com as exibições necessárias
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private initModalRubric(): void {
		let that = this;
		if (this.base64Rubric === null) {

			$("#" + this.containerId + "ModalViewerRubric").find(".BtModalSalvarRubric").text(this.translate('save')).addClass('sign-digital');
			$("#" + this.containerId + "ModalViewerRubric").find("form").show();
			$("#" + this.containerId + "ModalViewerRubric").find(".canvas-clone-container").hide();

			$("#" + that.containerId + "ModalViewerRubric").find(".radio-container").hide();
			$("#" + that.containerId + "ModalViewerRubric").find(".modal-footer").hide();

			$("#" + this.containerId + "ModalViewerRubric").find(".BtRubricGenerate").prop("disabled", true);

			$("#" + that.containerId + "ModalViewerRubric").find(".InputRubricName").unbind("keyup").on("keyup", function () {
				let val = $("#" + that.containerId + "ModalViewerRubric").find(".InputRubricName").val().toString();
				if (val !== "") {
					$("#" + that.containerId + "ModalViewerRubric").find(".BtRubricGenerate").prop("disabled", false);
				} else {
					$("#" + that.containerId + "ModalViewerRubric").find(".BtRubricGenerate").prop("disabled", true);
				}
			});

			$("#" + that.containerId + "ModalViewerRubric").find(".InputRubricName").trigger("keyup");

			$("#" + this.containerId + "ModalViewerRubric").find(".BtRubricGenerate").unbind("click").click(function () {
				let val = $("#" + that.containerId + "ModalViewerRubric").find(".InputRubricName").val().toString();
				that.nameValRubric = val;
				that.createRubricChoseModal(that.nameValRubric);
				$("#" + that.containerId + "ModalViewerRubric").find(".radio-container").show();
				$("#" + that.containerId + "ModalViewerRubric").find(".modal-footer").show();
			});
		} else {
			let radioChose = $('input[name=choseRubric' + this.containerId + ']:checked').val();
			$("#" + this.containerId + "ModalViewerRubric").find(".button--ghost").removeClass('sign-digital').show().removeAttr('style');
			$("#" + this.containerId + "ModalViewerRubric").find(".BtModalSalvarRubric").text("OK").removeClass('sign-digital').show();
			$("#" + this.containerId + "ModalViewerRubric").find("form").hide();
			$("#" + this.containerId + "ModalViewerRubric").find(".canvas-clone-container").show();
			$("#CanvasRubricClone" + this.containerId).attr("id", "CanvasRubric1" + this.containerId).text(this.nameValRubric).css({ "font-size": this.fontRubricSize + "px", "font-family": this.fontRubricName });
		}

		this.setAccreditationRubricType();
	}

	/**
	 * Set accreditation sign type
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private setAccreditationSignType(): void {
		if (this.IsEletronicSign) {
			$("#" + this.containerId + "ModalViewer").find('.sign-digital').show();
			$("#" + this.containerId + "ModalViewer").find('.certificates').hide();
		}
		else {
			$("#" + this.containerId + "ModalViewer").find('.certificates').show();
			$("#" + this.containerId + "ModalViewer").find('.sign-digital').hide();
			if (!this.HasCertificates) {
				toastr.warning(this.translate('certificatesNotFound'));
				$("#" + this.containerId + "ModalViewer").modal("hide");
			}
			else {
				this.generateHTMLCertificates();
				// $("#" + this.containerId + "ModalViewer").find('.BtModalSalvarSign').hide();
			}
		}
	}

	/**
	 * Set accreditation rubric type
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private setAccreditationRubricType(): void {
		$("#" + this.containerId + "ModalViewerRubric").find('.rubric-digital').show();
		$("#" + this.containerId + "ModalViewerRubric").find('.certificates').hide();
	}

	/**
	 * Generate html certificates list
	 *
	 * @private
	 * @memberof ViewerPdf
	 */
	private generateHTMLCertificates(): void {
		const divCertificates = document.getElementById(`certificates-list-${this.containerId}`) as HTMLDivElement;
		divCertificates.innerHTML = null;

		for (const certificate of this.options.certificates) {
			const a = document.createElement('a') as HTMLAnchorElement;
			a.id = certificate.id;
			a.className = 'list-simple-item';
			a.addEventListener('click', this.certificateClick.bind(this));

			const i = document.createElement('i') as HTMLElement;
			i.className = 'glyph ab-doc icon--22';

			const div = document.createElement('div') as HTMLDivElement;
			div.innerText = certificate.name;

			a.append(i);
			a.append(div);
			divCertificates.append(a);
		}
	}

	/**
	 * Click in certificates  list
	 *
	 * @param {*} event Event click
	 * @memberof ViewerPdf
	 */
	public certificateClick(event: any): void {
		const id = event.currentTarget.id;
		this.objSelectedCert = this.options.certificates.find(c => c.id === id);
		$("#" + this.containerId + "ModalViewer").find(".BtModalSalvarSign").click();
		$("#" + this.containerId + "ModalViewer").find(".BtModalSalvarRubric").click();
	}


	/**
	 * Get normalized certification info
	 *
	 * @private
	 * @returns {string}
	 * @memberof ViewerPdf
	 */
	private getCertInfoNormalize(): string {
		const isCNPJ = (this.objSelectedCert.cpfCnpj && this.objSelectedCert.cpfCnpj.length > 11);
		return `${this.translate('name')}: ${Utils.wordWrap(this.objSelectedCert.name, 40)}\n` +
			`${isCNPJ ? 'CNPJ' : 'CPF'}: ${this.objSelectedCert.cpfCnpj}\n` +
			`${this.translate('validate')}: ${this.objSelectedCert.expirationDate.toLocaleDateString()}\n` +
			`${this.translate('emitter')}: ${Utils.wordWrap(this.objSelectedCert.emitter, 40)}\n` +
			`${this.translate('date')}: ${this.objSelectedCert.currentDate.toLocaleDateString()}`;
	}

	/**
	 * Cria a lista de assinaturas para escolha
	 *
	 * @private
	 * @param {string} val
	 * @memberof ViewerPdf
	 */
	private createSignChoseModal(val: string): void {
		let that = this;
		$('#' + this.containerId + "ModalViewer" + ' .canvas-sign--1').attr("id", "CanvasSign1" + this.containerId).text(val).css({ "font-size": "28px", "font-family": "kalamaya-Regular" });
		$('#' + this.containerId + "ModalViewer" + ' .canvas-sign--2').attr("id", "CanvasSign2" + this.containerId).text(val).css({ "font-size": "23px", "font-family": "BeautifulHeart" });
		$('#' + this.containerId + "ModalViewer" + ' .canvas-sign--3').attr("id", "CanvasSign3" + this.containerId).text(val).css({ "font-size": "25px", "font-family": "Mistral" });

		$('input[name=choseSign' + this.containerId + ']').click(function () {
			let value = $(this).val();
			switch (value) {
				case "1":
					that.fontSignName = 'kalamaya-Regular';
					that.fontSignSize = 28;
					break;
				case "2":
					that.fontSignName = 'BeautifulHeart';
					that.fontSignSize = 23;
					break;
				case "3":
					that.fontSignName = 'Mistral';
					that.fontSignSize = 25;
					break;

				default:
					that.fontSignName = 'kalamaya-Regular';
					that.fontSignSize = 28
					break;
			}
		});

	}

	/**
	 * Cria a lista de rubricas para escolha
	 *
	 * @private
	 * @param {string} val
	 * @memberof ViewerPdf
	 */
	private createRubricChoseModal(val: string): void {
		let that = this;
		$('#' + this.containerId + "ModalViewerRubric" + ' .canvas-rubric--1').attr("id", "CanvasRubric1" + this.containerId).text(val).css({ "font-size": "28px", "font-family": "kalamaya-Regular" });
		$('#' + this.containerId + "ModalViewerRubric" + ' .canvas-rubric--2').attr("id", "CanvasRubric2" + this.containerId).text(val).css({ "font-size": "23px", "font-family": "BeautifulHeart" });
		$('#' + this.containerId + "ModalViewerRubric" + ' .canvas-rubric--3').attr("id", "CanvasRubric3" + this.containerId).text(val).css({ "font-size": "25px", "font-family": "Mistral" });

		$('input[name=choseRubric' + this.containerId + ']').click(function () {
			let value = $(this).val();
			switch (value) {
				case "1":
					that.fontRubricName = 'kalamaya-Regular';
					that.fontRubricSize = 28;
					break;
				case "2":
					that.fontRubricName = 'BeautifulHeart';
					that.fontRubricSize = 23;
					break;
				case "3":
					that.fontRubricName = 'Mistral';
					that.fontRubricSize = 25;
					break;

				default:
					that.fontRubricName = 'kalamaya-Regular';
					that.fontRubricSize = 28
					break;
			}
		});

	}

	private getDocsSign(index?: number): boolean {
		let isDocSign = this.docInfo[this.docIndex].section.filter(section => section.isSign === true).length >= this.docInfo[this.docIndex].section.length;
		if (isDocSign) {
			$("#" + this.containerId).find(`.menu__document a:eq(${this.docIndex}) i`).removeClass("ab-doc").addClass("ab-confirm").addClass("green");
		} else {
			$("#" + this.containerId).find(`.menu__document a:eq(${this.docIndex}) i`).removeClass("ab-confirm").addClass("ab-doc").removeClass("green");
		}
		let callOutDocs = $("#" + this.containerId).find(`.menu__document a .ab-doc`).length;
		$("#callOutDocs").text(callOutDocs);

		let countSectionTotal = 0;

		let countSectionSigned = 0;

		for (let index = 0; index < this.docInfo.length; index++) {
			countSectionTotal += this.docInfo[index].section.length;
		}
		for (let index = 0; index < this.docInfo.length; index++) {
			countSectionSigned += this.docInfo[index].section.filter(section => section.isSign === true).length;
		}

		let perc = (countSectionSigned * 100) / countSectionTotal;

		$("#signProgress").width(perc + "%");
		$("#signedCount").text(countSectionSigned);
		$("#signedTotal").text(countSectionTotal);


		return isDocSign;
	}

	//#endregion

	/////////////////////////////////////////////////////
	//#region Public methods
	/////////////////////////////////////////////////////

	/**
	 * Remover before onload
	 *
	 * @memberof ViewerPdf
	 */
	public removeBeforeUnload(): void {
		window.onbeforeunload = undefined;
	}

	/**
	 * Setar beforeonuload
	 *
	 * @param {*} e Evento
	 * @returns {string}
	 * @memberof ViewerPdf
	 */
	public setBeforeUnload(e: any): string {
		let text = this.translate('thereAreUnsavedItems');
		e.returnValue = this.storageObj ? text : null;
		return this.storageObj ? text : null;
	}

	/**
	 * Carrega o documento e inicializa os métodos de render das páginas
	 *
	 * @param {string} url Url do documento
	 * @param {string} fileName Nome do documento
	 * @param {number} index Índice
	 * @memberof ViewerPdf
	 */
	public loadDocument(url: string, fileName: string, index: number): void {
		$("#" + this.containerId).find('.pdf-container').html('');
		$('.loading').css('display', 'block');

		let that = this;
		this.url = url;
		this.docName = fileName;
		this.docIndex = index;
		this.currentMarkFocus = undefined;
		this.activeCanvas = 0;
		this.scale = defaultScale;

		let loadingTask = <any>this.PDFJSViewer.getDocument(url);
		loadingTask.promise.then(function (pdf: any) {
			that.pdfObj = pdf;
			that.numberOfPages = pdf.numPages;
			$("#" + that.containerId).find(".tooglePages span").text(that.numberOfPages);
			that.loadPages(pdf, false);

		}, function (reason: any) {
			console.error(reason);
			toastr.error(that.translate('errorLoadDoc') + reason);
			$('.loading').css('display', 'none');
			throw new Error(that.translate('errorLoadDoc') + reason);
		});
	}

	/**
	 * Cria o retangulo para marcar local de assinatura
	 *
	 * @param {*} objSection Coordenadas
	 * @param {boolean} isClickEvent É evento de clique
	 * @memberof ViewerPdf
	 */
	public createRect(objSection: any, isClickEvent: boolean, subscriberConfig: ISubscriberRectConfig): void {
		let that = this;
		let fabricObj = that.fabricObjects[that.activeCanvas];
		if (that.fabricObjects.length > 0) {
			$.each(that.fabricObjects, function (index, fabricObj) {
				fabricObj.isDrawingMode = false;
			});
		}

		if (!objSection || !objSection.type || objSection.type == SectionTypeEnum.Sign) {
			this.createSignRect(objSection, isClickEvent, fabricObj, subscriberConfig);
		} else if (objSection.type == SectionTypeEnum.Annotation) {
			this.createAnnotationRect(objSection, isClickEvent, fabricObj);
		} else {
			this.createSignRect(objSection, isClickEvent, fabricObj, subscriberConfig);
		}


		fabricObj.on("mouse:down", function (e, x) {
			let obj = e.target;
			if (obj != null) {
				that.unhandlerScroll();
			}
		})
		fabricObj.on("mouse:up", function (e, x) {
			that.handlerScroll();
			let obj = e.target;
			$("#" + that.containerId + " .canvas-container").find(".scrollDiv").hide();
			if (obj != null) {
				if (that.viewMode !== PdfViewMode.viewDocuments) {
					if (that.viewMode === PdfViewMode.signDocuments) {
						$(e.target.canvas.lowerCanvasEl).next().click();
						//$("#" + that.containerId).find(".abl-modal-viewer").modal("show");
						const signature = that.docInfo[that.docIndex].section
							.find(section => section.index === obj.data.index);

						that.currentMarkFocus = signature; // define que navegação de marcações deve partir desta marcação

						if (!signature.isSign && !signature.isRubric) {
							if (!$("body > .abl-modal-viewer")[0]) {
								$("#" + that.containerId).find(".abl-modal-viewer").appendTo("body");
								$("#" + that.containerId + "ModalViewer").modal("show");
							} else {
								$("#" + that.containerId + "ModalViewer").modal("show");
							}
							that.handleClickModalSign();
							that.initModalSign();
						}

						if (!signature.isSign && signature.isRubric) {
							if (!$("body > .abl-modal-viewer")[0]) {
								$("#" + that.containerId).find(".abl-modal-viewer").appendTo("body");
								$("#" + that.containerId + "ModalViewerRubric").modal("show");
							} else {
								$("#" + that.containerId + "ModalViewerRubric").modal("show");
							}
							that.handleClickModalRubric();
							that.initModalRubric();
						}

						// else {
						// 	console.log(obj);

						// 	$(e.target.canvas.lowerCanvasEl).closest(".canvas-container").append("<div class='closeSign' style='position:absolute; top: " + (obj.top - (40 * that.scale)) + "px; left: " + obj.left + "px'>X</div>")
						// }
					}
					if (that.viewMode === PdfViewMode.markDocuments) {
						let serialize = that.serializePdf.bind(that)();

						const objResult = {
							pdfDocument: that.pdfObj,
							docInfoSerialize: serialize,
							base64Sign: that.base64,
							base64Rubric: that.base64Rubric,
							selectedCertificate: that.objSelectedCert
						} as IViewerResult;

						that.callback(objResult);
						that.signObject(serialize);
					}
				}
			}
		})

		fabricObj.on("object:moving", function (e) {
			let obj = e.target;
			let canvas = obj.canvas;
			let top = obj.top;
			let left = obj.left;
			let zoom = canvas.getZoom();
			let pan_x = canvas.viewportTransform[4];
			let pan_y = canvas.viewportTransform[5];

			// width & height será calculado aplicando o inverso da viewportTransform atual
			let c_width = canvas.width / zoom;
			let c_height = canvas.height / zoom;


			let w = obj.width * obj.scaleX;
			let left_adjust, right_adjust
			if (obj.originX == "center") {
				left_adjust = right_adjust = w / 2;
			} else {
				left_adjust = 0;
				right_adjust = w;
			}

			let h = obj.height * obj.scaleY;
			let top_adjust, bottom_adjust;
			if (obj.originY == "center") {
				top_adjust = bottom_adjust = h / 2;
			} else {
				top_adjust = 0;
				bottom_adjust = h;
			}

			// se precisar de margem setar aqui
			let top_margin = 0;
			let bottom_margin = 0;
			let left_margin = 0;
			let right_margin = 0;


			let top_bound = top_margin + top_adjust - pan_y;
			let bottom_bound = c_height - bottom_adjust - bottom_margin - pan_y;
			let left_bound = left_margin + left_adjust - pan_x;
			let right_bound = c_width - right_adjust - right_margin - pan_x;

			if (w > c_width) {
				obj.set("left", left_bound);
			} else {
				obj.set("left", Math.min(Math.max(left, left_bound), right_bound));
			}

			if (h > c_height) {
				obj.set("top", top_bound);
			} else {
				obj.set("top", Math.min(Math.max(top, top_bound), bottom_bound));
			}
		});


	}

	public createSignRect(objSection: any, isClickEvent: boolean, fabricObj: any, subscriberConfig: ISubscriberRectConfig): void {
		let that = this;
		let scaleObject = that.scale;
		let w = (!that.IsEletronicSign && !subscriberConfig?.isRubric ? 266 * scaleObject : 225 * scaleObject);
		let h = (!that.IsEletronicSign && !subscriberConfig?.isRubric ? 86 * scaleObject : 30 * scaleObject);

		if (objSection && objSection.isSign) {
			let originY = !that.IsEletronicSign && !subscriberConfig?.isRubric ? 'top' : 'bottom';

			const baseFontSize = !subscriberConfig.isRubric ? that.fontSignSize : that.fontRubricSize;
			const baseFontName = !subscriberConfig.isRubric ? that.fontSignName : that.fontRubricName;
			const basenameVal = !subscriberConfig.isRubric ? that.nameValSign : that.nameValRubric

			let fontSize = !that.IsEletronicSign && !subscriberConfig?.isRubric ? 10 * scaleObject : baseFontSize * scaleObject;
			let fontFamily = !that.IsEletronicSign && !subscriberConfig?.isRubric ? 'Arial' : baseFontName;
			let textVal = !that.IsEletronicSign && !subscriberConfig?.isRubric ? that.getCertInfoNormalize() : basenameVal;

			const topPositionCalculated = objSection ? (fabricObj.height) - ((!that.IsEletronicSign && !subscriberConfig?.isRubric ? objSection.bottom + 85 : objSection.bottom) * scaleObject) : 0;

			var textSign1 = new fabric.Text(textVal, {
				fontSize: fontSize,
				fontFamily: fontFamily,
				fontWeight: 'normal',
				originX: 'left',
				originY: originY,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
				lockMovementX: that.viewMode === PdfViewMode.signDocuments ? true : false,
				lockMovementY: that.viewMode === PdfViewMode.signDocuments ? true : false,
				selectable: false,
				hasControls: false,
				top: topPositionCalculated,
				left: objSection ? (objSection.left + 18) * scaleObject : 0,
				data: {
					index: objSection.index, // Index to burn the imag
					isRubric: subscriberConfig.isRubric,
				},
				hoverCursor: "default"
			});
			//if (!that.IsEletronicSign) {
			// textSign1.set('backgroundColor', 'rgba(0, 152, 154, 0.2)');
			//}
			fabricObj.add(textSign1);

			const classDivDeleteRect = subscriberConfig.isRubric ? 'closeRubric' : 'closeSign';			
			$(that.fabricObjects[that.activeCanvas].lowerCanvasEl).closest(".canvas-container").append("<div class='" + classDivDeleteRect + "' data-indice='" + (objSection.index ? objSection.index : 0) + "' style='position:absolute; top: " + ((fabricObj.height) - ((!that.IsEletronicSign && !subscriberConfig?.isRubric ? objSection.bottom + 90 : objSection.bottom + 30) * scaleObject)) + "px; left: " + ((objSection ? objSection.left * scaleObject : 0) - (10 * that.scale)) + "px; font-size: " + (16 * scaleObject) + "px'><i class='glyph ab-delete'></i></div>");
			// $(that.fabricObjects[that.activeCanvas].lowerCanvasEl).closest(".canvas-container").append("<div class='closeSign' data-indice='" + (objSection.index ? objSection.index : 0) + "' style='position:absolute; top: " + ((!that.IsEletronicSign ? objSection.bottom - (66 * that.scale) : objSection.bottom - (10 * that.scale)) - (23 * that.scale)) + "px; left: " + (objSection.left - (15 * that.scale)) + "px; font-size: " + (16 * scaleObject) + "px'><i class='glyph ab-delete'></i></div>");
			if(!subscriberConfig.isRubric) {
				that.handleClickEditSign();
			} else {
				that.handleClickEditRubric();
			}
		} else {
			fabric.Image.fromURL('//cdn.abaris.com.br/assets/img/icone-marcacao.png', function (img) {
				let img1 = img.scale(.3 * scaleObject).set({ left: 3, top: 5 });
				let rect = new fabric.Rect({
					width: w,
					height: h,
					fill: subscriberConfig.color + '99',
					stroke: subscriberConfig.color,
					top: 0,
					left: 0
				});

				const prevLabelType = !subscriberConfig.isRubric ? that.translate('subscriber') : that.translate('rubric');
				const subscriberName = `${prevLabelType}: ${subscriberConfig.name}`;
				let textSubscriber = Utils.truncateString(subscriberName, 33);

				if (that.viewMode === PdfViewMode.signDocuments) {
					textSubscriber = !subscriberConfig.isRubric ? that.translate('signHere') : that.translate('rubricateHere');
				}

				var text = new fabric.Text(textSubscriber, {
					fontSize: 12 * scaleObject,
					fontFamily: 'Open sans',
					fontWeight: 'bold',
					originX: 'left',
					originY: 'center',
					top: 15 * scaleObject,
					left: 30 * scaleObject,
					data: (objSection) ? objSection.index : 0 // Index to burn the image
				});

				const topPositionCalculated = objSection ? (fabricObj.height) - ((!that.IsEletronicSign && !subscriberConfig?.isRubric ? objSection.bottom + 87 : objSection.bottom + 30) * scaleObject) : 0;
				
				let group = new fabric.Group([img1, rect, text], {
					left: objSection ? objSection.left * scaleObject : 0,
					top: topPositionCalculated,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: that.viewMode === PdfViewMode.markDocuments ? false : true,
					lockMovementY: that.viewMode === PdfViewMode.markDocuments ? false : true,
					hasControls: false,
					data: {
						index: (objSection) ? objSection.index : 0,
						idSubscriber: subscriberConfig.idSubscriber,
						isRubric: subscriberConfig.isRubric
					},
				});

				// adiciona grupo ao canvas
				fabricObj.add(group);

				if (isClickEvent) {
					let serialize = that.serializePdf.bind(that)();

					const objResult = {
						pdfDocument: that.pdfObj,
						docInfoSerialize: serialize,
						base64Sign: that.base64,
						base64Rubric: that.base64Rubric,
						selectedCertificate: that.objSelectedCert
					} as IViewerResult;

					that.callback(objResult);
					that.signObject(serialize);
				}
			});
		}
	}

	public createAnnotationRect(objSection: IDocumentSectionModel, isClickEvent: boolean, fabricObj: any): void {
		let that = this;
		let scaleObject: number = that.scale;
		let width: number = objSection.width * scaleObject;
		let height: number = objSection.height * scaleObject;
		let top: number = objSection.top * scaleObject;
		let left: number = objSection.left * scaleObject;

		let fill: string;
		let stroke: string = '';
		let shaowTextPadding = 5 * scaleObject;

		switch (objSection.annotationType) {
			case AnnotationTypeEnum.Highlight:
				fill = "rgba(229, 223, 51, 0.5)";
				break;
			case AnnotationTypeEnum.TextCap:
				fill = "rgba(0, 0, 0, 1)";
				break;
			case AnnotationTypeEnum.Postit:
				fill = "rgba(255, 255, 255, 1)";
				stroke = "rgba(0, 0, 0, 1)";
				break;

			default:
				break;
		}

		//Utils.wordWrap(this.objSelectedCert.name, 40)


		let rect = new fabric.Rect({
			width: width,
			height: height,
			fill: fill,
			stroke: stroke,
			top: top,
			left: left,
			selectable: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			lockMovementX: true,
			lockMovementY: true,
			hasControls: false,
			hoverCursor: "default",
			moveCursor: "default"
		});

		if (objSection.annotationType == AnnotationTypeEnum.Postit) {
			let textString = '';

			if (objSection.text && objSection.text !== '') {
				textString = Utils.wordWrap(objSection.text, width / (7 * scaleObject));

				let text = new fabric.Text(textString, {
					fontSize: 15 * scaleObject,
					fontFamily: 'Arial',
					fontWeight: 'normal',
					top: top + (3 * scaleObject),
					left: left + shaowTextPadding,
				});
				let rectShadow = new fabric.Rect({
					width: width,
					height: height,
					fill: "rgba(0, 0, 0, 0.3)",
					top: top + shaowTextPadding,
					left: left + shaowTextPadding,
					selectable: false,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: true,
					lockMovementY: true,
					hasControls: false,
				});
				let group = new fabric.Group([rectShadow, rect, text], {
					left: left,
					top: top,
					selectable: false,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					lockMovementX: true,
					lockMovementY: true,
					hasControls: false,
					hoverCursor: "default",
					moveCursor: "default"
				});

				fabricObj.add(group);
			}

		} else if (objSection.annotationType == AnnotationTypeEnum.Stamp) {
			let rectStamp = new fabric.Rect({
				width: width,
				height: height,
				fill: "rgba(0, 0, 0, 0)",
				stroke: objSection.color,
				strokeWidth: 10 * scaleObject,
				rx: 10,
				ry: 10,
				left: left,
				top: top,
				opacity: .7
			});

			let textStamp = new fabric.Textbox(objSection.text, {
				fontSize: (15 * width) / 100,
				fontFamily: 'Arial',
				fontWeight: 'normal',
				width: width,
				height: height,
				textAlign: 'left',
				fill: objSection.color,
				left: left + (12 * scaleObject),
				top: top + (10 * scaleObject),
				scaleY: 1.5,
				scaleX: 1.5,
				opacity: .7
			});

			let groupStamp = new fabric.Group([rectStamp, textStamp], {
				left: left,
				top: top,
				selectable: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
				lockMovementX: true,
				lockMovementY: true,
				hasControls: false,
				hoverCursor: "default",
				moveCursor: "default"
			});
			fabricObj.add(groupStamp);
		} else {
			fabricObj.add(rect);
		}

	}

	public handlerScroll(): void {
		let that = this;
		$("#" + this.containerId + " .pdf-container").on('touchstart', function (e) {
			// var currentY = e.originalEvent.touches[0].clientY;
			// that.lastY = currentY;
			// e.preventDefault();
			var touchStartY = e.touches[0].clientY;
			var touchStartX = e.touches[0].clientX;
			var touchDistanceY = 0;
			var touchDistanceX = 0;
			let timeout = null;

			function touchMove(e) {
				touchDistanceY = e.touches[0].clientY - touchStartY;
				touchDistanceX = e.touches[0].clientX - touchStartX;
				$(this).stop().animate({ scrollTop: $(this).scrollTop() - touchDistanceY }, 500, 'swing');
				$(this).scrollLeft($(this).scrollLeft() - touchDistanceX);
			}

			$(this).on('touchmove', touchMove).one('touchend', function () {
				$(this).off('touchmove', touchMove);
			});
		});
		// $("#" + this.containerId + " .pdf-container").on('touchmove', function (e) {
		// 	e.preventDefault();
		// 	e.stopPropagation();

		// 	var currentY = e.originalEvent.touches[0].clientY;
		// 	var delta = that.lastY - currentY;

		// 	var valor = null;
		// 	valor += delta * -1;
		// 	that.lastY = currentY;

		// 	//var x = e.touches[0]
		// 	console.log(currentY);
		// 	$(this).stop().animate({scrollTop: valor}, 500, 'swing', function() {
		// 		//alert("Finished animating");
		// 	 });
		// });
	}

	public unhandlerScroll(): void {
		$("#" + this.containerId + " .pdf-container").off('touchstart');
	}

	/**
	 * Trata a sessão com os objetos de marcação
	 *
	 * @param {*} obj Objeto de marcação
	 * @memberof ViewerPdf
	 */
	public signObject(obj: any): void {
		if (obj) {
			sessionStorage.setItem("ObjSign", obj);
		} else {
			sessionStorage.removeItem("ObjSign");
		}
	}
	
	/**
	 * Reload pdf by FabricObjects
	 *
	 * @memberof ViewerPdf
	 */
	 public reloadPdfByFabricObjects(): void {
		const storageObj = sessionStorage.getItem("ObjSign");
		let serializeObj = JSON.parse(storageObj);
		serializeObj[this.docIndex].section = [];
		this.docInfo[this.docIndex].section = [];
		const serializeStr = JSON.stringify(serializeObj, null, 4);
		this.signObject(serializeStr);
	}

	/**
	 * Deleta o objeto de marcação selecionado
	 *
	 * @memberof ViewerPdf
	 */
	public deleteSelectedObject(): void {
		var that = this;
		var activeObject = that.fabricObjects[that.activeCanvas].getActiveObject();
		if (activeObject) {
			if (confirm(that.translate('deleteMarkup'))) {
				that.fabricObjects[that.activeCanvas].remove(activeObject);
				
				that.reloadPdfByFabricObjects();

				let serialize = that.serializePdf.bind(that)();

				const objResult = {
					pdfDocument: that.pdfObj,
					docInfoSerialize: serialize,
					base64Sign: that.base64,
					base64Rubric: that.base64Rubric,
					selectedCertificate: that.objSelectedCert
				} as IViewerResult;

				that.callback(objResult);
				this.signObject(serialize);
			}
		} else {
			toastr.warning(this.translate('selectMarkup'));
		}
	}

	/**
	 * Deleta os objetos de marcação da página
	 *
	 * @memberof ViewerPdf
	 */
	public clearActivePage(): void {
		var that = this;
		var fabricObj = that.fabricObjects[that.activeCanvas];
		var bg = fabricObj.backgroundImage;
		if (confirm(that.translate('deleteAllMarkup'))) {
			fabricObj.clear();
			fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
			
			that.reloadPdfByFabricObjects();

			let serialize = that.serializePdf.bind(that)();

			const objResult = {
				pdfDocument: that.pdfObj,
				docInfoSerialize: serialize,
				base64Sign: that.base64,
				base64Rubric: that.base64Rubric,
				selectedCertificate: that.objSelectedCert
			} as IViewerResult;

			that.callback(objResult);
			this.signObject(serialize);
		}
	}

	/**
	 * Serializa um objeto das marc ações presentes no doc
	 *
	 * @returns {string}
	 * @memberof ViewerPdf
	 */
	public serializePdf(index: number = null): string {
		let that = this;
		let scaleObject = this.scale;

		that.storageObj = sessionStorage.getItem("ObjSign");
		let strObj = JSON.parse(that.storageObj);

		this.objFileList.forEach(function (val, i) {
			that.docInfo[i] = {
				fileName: val.fileName,
				section: strObj && strObj[i].section && strObj[i].section.length > 0 ? strObj[i].section : [],
				isDocSign: strObj && strObj[i].isDocSign ? true : false
			};
		});

		if (this.viewMode === PdfViewMode.signDocuments) { // Modo assinando

			that.fabricObjects.forEach(function (val, i) {
				val._objects.forEach(function (item, j) {
					const sectionIndex = that.docInfo[that.docIndex].section.findIndex(d => d.index === item.data.index);
					if (item.data.index === index) { // procura local de assinatura pelo index passado
						that.docInfo[that.docIndex].section[sectionIndex].isSign =
							((that.base64 || that.base64Rubric) && index === item.data.index) ? true : false;
					}
					that.docInfo[that.docIndex].section[sectionIndex].pageNumber = i + 1;
					that.docInfo[that.docIndex].section[sectionIndex].type = item.data.type;
					
				});
			});
			that.docInfo[that.docIndex].isDocSign = that.getDocsSign();
		}
		else {
			if (this.viewMode !== PdfViewMode.viewDocuments && that.docInfo[that.docIndex].section) {
				if(!!that.fabricObjects && that.fabricObjects.filter(fabric => fabric._objects.length > 0).length > 0) {
					that.docInfo[that.docIndex].section = [];
				}

				that.fabricObjects.forEach(function (val, i) {
					val._objects.forEach(function (item, j) {
						let left = item.oCoords.bl.x / scaleObject;
						let bottom = (val.height / scaleObject) - (item.oCoords.bl.y / scaleObject);

						that.docInfo[that.docIndex].section.push({
							left: left >= 0 ? left : 0,
							bottom: bottom >= 0 ? bottom : 0,
							pageNumber: i + 1,
							index: item.data.index,
							idSubscriber: item.data.idSubscriber,
							isSign: false,
							isRubric: item.data.isRubric,
						});
					});
				});
			}
		}

		if( this.viewMode === PdfViewMode.markDocuments ) {
			this.verifySectionsUpdateSubscribersListStatus();
		}

		return JSON.stringify(this.docInfo, null, 4);
	}

	/**
	 * Método para navegar entre as assinaturas do documento
	 *
	 * @param {number} index Index da assinatura
	 * @memberof ViewerPdf
	 */
	public goToSignature(index: number): void {
		const that = this;

		let signature;
		this.fabricObjects.forEach(function (val, i) {
			val._objects.forEach(function (item, j) {
				if (index === item.data.index) {
					signature = that.docInfo[that.docIndex].section.find(section => index === section.index);
				}
			});
		});

		if (!!signature) { // mover
			const pdfContainerHtml = $("#" + this.containerId + " .pdf-container");
			const displacementY = this.calcDisplacementToPage(signature.pageNumber);
			const tagSize = (!that.IsEletronicSign && !signature?.isRubric) ? 87 : 30;
			const topRefElement = displacementY + 20 - (signature.bottom * this.scale) - (tagSize * this.scale);

			pdfContainerHtml.animate({ scrollTop: topRefElement }, 500, 'swing');
		} else {
			toastr.warning(this.translate('markNotFound'));
		}
	}
	
	public calcDisplacementToPage(page) {
		const pdfContainerHtml = $("#" + this.containerId + " .pdf-container");

			let displacementY = 0;
			for (var i = 0; i < page; i++) {
				const child = pdfContainerHtml[0].childNodes[i];

				let pageBrackDisplacement = 0;
				if(i > 0) { // não adicionar na ultima página
					pageBrackDisplacement = 25; // 25px é a margin bottom
				}

				displacementY += (<any>child).clientHeight + pageBrackDisplacement; 
			}

			return displacementY;
	}

	public verifyMarksFilterSections() {
		return this.docInfo[this.docIndex].section.filter(section =>
			(this.marksFilterRubrics ? section.isRubric : false) || (this.marksFilterSignatures ? !section.isRubric : false)
		)
			.map(section => ({ ...section, bottom: section.bottom * this.scale }))
			.sort((a, b) => (a.pageNumber === b.pageNumber ? 0 : 1) || b.bottom - a.bottom);
	}

	/**
	 * Método para navegar para a próxima assinatura
	 *
	 * @param {number} index Index da assinatura
	 * @memberof ViewerPdf
	 */
	public goToNextSignature(): void {
		if(!this.marksFilterRubrics && !this.marksFilterSignatures) {
			toastr.warning(this.translate('selectOneMarkupType'));
			return;
		}

		const arraySections = this.verifyMarksFilterSections();
		let arrayIndex = arraySections.findIndex(section => section.index === this.currentMarkFocus?.index);

		if (arrayIndex == -1) { // se não encontrar section
			var section = arraySections[0];
			if(section) {
				this.goToSignature(section.index);
				this.currentMarkFocus = section;
			} else {
				toastr.warning(this.translate('markNotFound'));
			}
		} else {
			arrayIndex++;
			const docMaxIndex = arraySections.length - 1;
			if (arrayIndex >= docMaxIndex) {
				
				// this.loadDocument(this.fileList[this.docIndex + 1].tempPath, this.fileList[this.docIndex + 1].fileName, this.docIndex + 1);
				var section = arraySections[arrayIndex];
				if(section) {
					this.goToSignature(section.index);
					this.currentMarkFocus = section;
				} else {
					if ((this.docIndex + 1) <= (this.fileList.length + 1)) {
						$("#" + this.containerId).find(".menu__document a:eq(" + (this.docIndex + 1) + ")").trigger("click");
					}
				}
				
			}
			
		}
	}

	/**
	 * Método para navegar para a assinatura anterior
	 *
	 * @param {number} index Index da assinatura
	 * @memberof ViewerPdf
	 */
	public goToPrevSignature(): void {
		if(!this.marksFilterRubrics && !this.marksFilterSignatures) {
			toastr.warning(this.translate('selectOneMarkupType'));
			return;
		}

		const arraySections = this.verifyMarksFilterSections();
		let arrayIndex = arraySections.findIndex(section => section.index === this.currentMarkFocus?.index);

		if (arrayIndex == -1) { // se não encontrar section
			var section = arraySections[0];
			if(section) {
				this.goToSignature(section.index);
				this.currentMarkFocus = section;
			} else {
				toastr.warning(this.translate('markNotFound'));
			}
		} else {
			arrayIndex--;
			if (arrayIndex <= 0) {
				
				var section = arraySections[arrayIndex];
				if(section) {
					this.goToSignature(section.index);
					this.currentMarkFocus = section;
				} else {
					if ((this.docIndex - 1) >= 0) {
						$("#" + this.containerId).find(".menu__document a:eq(" + (this.docIndex - 1) + ")").trigger("click");
					}
				}
			}

		}
	}

	/**
	 * Método para navegar entre as páginas do documento
	 *
	 * @param {string} num Número da página
	 * @memberof ViewerPdf
	 */
	public gotoPage(num: number): void {
		if(num < 0){
			num = 0;
		}

		if (num <= this.numberOfPages) {
			let container = document.querySelectorAll("#" + this.containerId + " .pdf-container")[0];

			container.scrollTop = this.calcDisplacementToPage(num);
		} else {
			toastr.warning(this.translate('incorrectPageNumber'));
		}

	}

	/**
	 * Método para acionar o zoom no documento
	 *
	 * @param {string} type Tipo de zoom
	 * @memberof ViewerPdf
	 */
	public zoomDoc(type: string): void {
		if (type === "in") {
			if (this.scale <= 2.8) {
				this.scale = this.scale + 0.3;
				this.loadPages(this.pdfObj, true);
			}
		}
		if (type === "out") {

			let pageViewport = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

			if (this.scale >= 1.0) {
				this.scale = this.scale - 0.3;
				this.loadPages(this.pdfObj, true);
			}
			else if (pageViewport <= 1024 && this.scale >= 0.5) {
				this.scale = this.scale - 0.3;
				this.loadPages(this.pdfObj, true);
			}
		}
	}

	/**
	 * Download do documento
	 *
	 * @param {string} blobUrl Url do documento
	 * @param {string} filename Nome do documento
	 * @memberof ViewerPdf
	 */
	public download(blobUrl: any, filename: string): void {
		let a = document.createElement('a');

		if (!a.click) {
			throw new Error('DownloadManager: "a.click()" is not supported.');
		}
		a.href = blobUrl;
		a.target = '_blank';
		// Use a.download if available. This increases the likelihood that
		// the file is downloaded instead of opened by another PDF plugin.
		if ('download' in a) {
			a.download = filename;
		}
		// <a> must be in the document for IE and recent Firefox versions,
		// otherwise .click() is ignored.
		(document.body || document.documentElement).appendChild(a);
		a.click();
		a.remove();
	}

	/**
	 * Método para imprimir doc
	 *
	 * @param {string} url Url do documento
	 * @memberof ViewerPdf
	 */
	public printDoc(): void {
		let that = this;

		var doc = new jsPDF();
		$.each(that.fabricObjects, function (index, fabricObj) {
			if (fabricObj.lowerCanvasEl.id.indexOf("page") != -1) {

				//let nHW: any = {};
				//nHW = that.resizeImage(fabricObj.width, fabricObj.height, 595, 842);

				//fabricObj.width = parseInt(nHW.newWidth);

				//fabricObj.height = parseInt(nHW.newHeight);
				if (index != 0) {
					doc.addPage();
					doc.setPage(index + 1);
				}



				doc.addImage(fabricObj.toDataURL(), 'png', 0, 0, fabricObj.width, fabricObj.height);
			}
		});
		// doc.autoPrint();
		//window.open(doc.output('bloburl'), '_blank');

		this.download(doc.output('bloburl'), "pdf.pdf")

	}

	/**
	 * Muda o tamanho da imagem
	 *
	 * @param {number} w Largura
	 * @param {number} h Altura
	 * @param {number} maxWidth Largura máxima
	 * @param {number} maxHeight Altura máxima
	 * @returns {*}
	 * @memberof ViewerPdf
	 */
	public resizeImage(w: number, h: number, maxWidth: number, maxHeight: number): any {

		var ratio = 0;  // Used for aspect ratio
		var width = w;    // Current image width
		var height = h;  // Current image height
		var newWidth;
		var newHeight;


		// Check if the current width is larger than the max
		if (width > maxWidth) {
			ratio = maxWidth / width;   // get ratio for scaling image
			newWidth = maxWidth; // Set new width
			newHeight = height * ratio;  // Scale height based on ratio
			height = height * ratio;    // Reset height to match scaled image
			width = width * ratio;    // Reset width to match scaled image
		}

		// Check if current height is larger than max
		if (height > maxHeight) {
			ratio = maxHeight / height; // get ratio for scaling image
			newHeight = maxHeight;   // Set new height
			newWidth = width * ratio;  // Scale width based on ratio
			width = width * ratio;    // Reset width to match scaled image
			height = height * ratio;    // Reset height to match scaled image
		}

		return { newWidth: Math.round(newWidth), newHeight: Math.round(newHeight) };
	}

	//#endregion
}



