
/**
 * Check if the status code of the response is 200 or not
 * @param response express response object
 */

const JSON_HEADER = /application\/json/i;

export let handleFetchNonOK = async ( response ) => {
  if (!response.ok) {
    // Get error message from the 'error' property, if the payload is JSON
    if (JSON_HEADER.test(response.headers.get('Content-Type'))) {
      const json = await response.json();
      throw Error(json.error || response.statusText);
    }
    throw Error(response.statusText);
  }
  return response;
};
