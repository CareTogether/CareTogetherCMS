export function handleBackdropClick(
	onClose: ((event: any, reason: `backdropClick` | `escapeKeyDown`) => void) | undefined, 
	event: any, 
	reason: `backdropClick` | `escapeKeyDown`
) {
	console.group(`handleBackdropClick`);
	console.log(event);
	console.log(reason);
	console.groupEnd();

	if (onClose && reason !== `backdropClick`) {
		onClose(event, reason);
	}
}