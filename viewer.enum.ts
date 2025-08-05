/**
 * Section type enum
 *
 * @export
 * @enum {number}
 */
export enum SectionTypeEnum {
    Sign,
    Annotation,
}


/**
 * Accreditation type enum
 *
 * @export
 * @enum {number}
 */
export enum AccreditationTypeEnum {
    Electronics,
    ICP,
    Institutional
}

/**
 * Annotation type enum
 *
 * @export
 * @enum {number}
 */
export enum AnnotationTypeEnum {
    Nenhum,
    Postit,
    Highlight,
    TextCap,
    TextBaloon,
    Image,
    Stamp
}

/**
 * View mode viewer
 *
 * @export
 * @enum {number}
 */
export enum PdfViewMode {
    /**
     * Only view documents
     */
    viewDocuments = 0,
    /**
     * Sign documents
     */
    signDocuments = 1,
    /**
     * Makup documents
     */
    markDocuments = 2
}

/**
 * Enum subscribers status
 *
 * @export
 * @enum {number}
 */
 export enum SubscriberEmailStatusEnum {
    None,
    Delivered,
    Open,
    Click
}

/**
 * Enum subscribers status
 *
 * @export
 * @enum {number}
 */
 export enum SubscriberStatusEnum {
    Pending,
    Rejected,
    Signed,
    Error
}
