export function isBackdropClick(reason: string): boolean {	
	console.warn(reason === `backdropClick` ? `Don't even try it!` : ``);
	return reason === `backdropClick`;
}

export function handleBackdropClick(
	onClose: ((event: object, reason: `backdropClick` | `escapeKeyDown`) => void) | undefined, 
	event: object, 
	reason: `backdropClick` | `escapeKeyDown`
) {
	if (onClose && !isBackdropClick(reason)) {
		onClose(event, reason);
	}
}