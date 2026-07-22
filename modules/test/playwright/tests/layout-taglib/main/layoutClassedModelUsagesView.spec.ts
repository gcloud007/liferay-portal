/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {apiHelpersTest} from '../../../fixtures/apiHelpersTest';
import {isolatedSiteTest} from '../../../fixtures/isolatedSiteTest';
import {loginTest} from '../../../fixtures/loginTest';
import getRandomString from '../../../utils/getRandomString';
import {PORTLET_URLS} from '../../../utils/portletUrls';
import getBasicWebContentStructureId from '../../../utils/structured-content/getBasicWebContentStructureId';

const test = mergeTests(apiHelpersTest, isolatedSiteTest, loginTest());

test(
	'Layout classed model usages request carries the layout context so the language is not reset',
	{
		tag: '@LPD-98533',
	},
	async ({apiHelpers, page, site}) => {

		// Create a web content on the isolated site

		const webContent =
			await apiHelpers.jsonWebServicesJournal.addWebContent({
				ddmStructureId: await getBasicWebContentStructureId(apiHelpers),
				groupId: site.id,
				titleMap: {en_US: `WC ${getRandomString()}`},
			});

		// Start listening for the usages request before it fires

		const usagesRequestPromise = page.waitForRequest((request) =>
			request.url().includes('get_layout_classed_model_usages')
		);

		// Open the web content editor, which fires the usages request

		const namespace = '_com_liferay_journal_web_portlet_JournalPortlet_';

		await page.goto(
			`/group${site.friendlyUrlPath}${PORTLET_URLS.journal}&${namespace}mvcRenderCommandName=%2Fjournal%2Fedit_article&${namespace}groupId=${site.id}&${namespace}articleId=${webContent.articleId}`
		);

		// The request must carry p_l_id so the locale resolves against the
		// current layout instead of the default site

		const usagesRequest = await usagesRequestPromise;

		expect(usagesRequest.url()).toContain('p_l_id=');
	}
);
